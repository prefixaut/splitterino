import { DepGraph } from 'dependency-graph';
import { Injector } from 'lightweight-di';
import { join } from 'path';
import { satisfies as semverSatisfies } from 'semver';
import { Context, createContext, Script } from 'vm';

import { HANDLER_REPLACE_PLUGINS } from '../common/constants';
import { Plugin } from '../models/plugins';
import {
    ACTION_SERVICE_TOKEN,
    ELECTRON_SERVICE_TOKEN,
    IO_SERVICE_TOKEN,
    IOServiceInterface,
    IPC_CLIENT_SERVICE_TOKEN,
    STORE_SERVICE_TOKEN,
    TRANSFORMER_SERVICE_TOKEN,
    VALIDATOR_SERVICE_TOKEN,
} from '../models/services';
import { LoadedPlugin } from '../models/states/plugins.state';
import { Logger } from '../utils/logger';
import { createPluginInstanceInjector } from '../utils/plugin';

interface InstantiatedPlugin {
    loadedPlugin: LoadedPlugin;
    instance: Plugin;
}

export class PluginManager {
    private static instantiatedPlugins: InstantiatedPlugin[] = [];
    private static depGraph: DepGraph<LoadedPlugin>;
    private static ioService: IOServiceInterface;
    private static injector: Injector;

    public static async loadPluginsIntoContext(injector: Injector) {

        Logger.trace('Loading plugin meta files from directory');

        this.injector = injector;
        this.ioService = injector.get(IO_SERVICE_TOKEN);
        const loadedPlugins = this.ioService.loadPluginFiles();
        const validPlugins: LoadedPlugin[] = [];
        this.depGraph = new DepGraph();
        const nodesMarkedForRemoval: string[] = [];

        Logger.debug('Loaded plugin meta files from directy. Starting initialization...');

        for (const plugin of loadedPlugins) {
            const { meta } = plugin;
            // Check if at least one file is available to load
            if (
                meta.entryFile == null &&
                (meta.components == null || meta.components.length === 0)
            ) {
                Logger.warn(`Plugin "${meta.name}" does not contain a reference to an entry file or component`);
                continue;
            }

            // Check if plugin is compatible with current splitterino version
            if (!semverSatisfies(process.env.SPL_VERSION, meta.compatibleVersion)) {
                Logger.warn({
                    msg: `Plugin "${meta.name}" is not compatible with the current splitterino version`,
                    currentVersion: process.env.SPL_VERSION,
                    compatibleVersions: meta.compatibleVersion
                });
                continue;
            }

            this.addToDepGraph(plugin);
            validPlugins.push(plugin);
        }

        for (const plugin of validPlugins) {
            const { meta } = plugin;
            // Required deps
            for (const [depName, depVersion] of Object.entries(meta.dependencies ?? {})) {
                const nodeToRemove = this.addDependency(meta.name, depName, depVersion);

                if (nodeToRemove != null) {
                    nodesMarkedForRemoval.push(nodeToRemove);
                }
            }

            // Optional deps
            for (const [depName, depVersion] of Object.entries(meta.optionalDependencies ?? {})) {
                this.addOptionalDependency(meta.name, depName, depVersion);
            }
        }

        for (const node of nodesMarkedForRemoval) {
            this.removeDependants(node);
        }

        await this.loadEntryFilesFromDepGraph();

        for (const plugin of this.instantiatedPlugins) {
            const deps = this.depGraph.dependantsOf(plugin.loadedPlugin.meta.name);
            for (const dep of deps) {
                const version = this.depGraph.getNodeData(dep).meta.version;
                plugin.loadedPlugin.dependants.push({
                    name: dep,
                    version,
                });
            }
        }

        const store = this.injector.get(STORE_SERVICE_TOKEN);
        store.commit(HANDLER_REPLACE_PLUGINS, this.instantiatedPlugins.map(instance => instance.loadedPlugin));

        Logger.info('Initialized all compatible plugins');
        if (this.instantiatedPlugins.length > 0) {
            Logger.info({
                msg: 'List of loaded plugins',
                plugins: this.instantiatedPlugins.map(pl => {
                    return {
                        [pl.loadedPlugin.meta.name]: pl.loadedPlugin.meta.version
                    };
                }).reduce((prev, curr) => {
                    return {
                        ...prev,
                        ...curr
                    };
                })
            });
        } else {
            Logger.info('No plugins were loaded');
        }
    }

    public static async teardown() {
        const order = this.depGraph.overallOrder().reverse();

        for (const plugin of order) {
            const instantiatedPlugin = this.instantiatedPlugins.find(pl => pl.loadedPlugin.meta.name === plugin);
            if (instantiatedPlugin != null) {
                await this.teardownSinglePlugin(instantiatedPlugin);
            }
        }
    }

    private static addToDepGraph(loadedPlugin: LoadedPlugin) {
        if (this.depGraph.hasNode(loadedPlugin.meta.name)) {
            // TODO: Do better error handling like removing older version etc.
            throw new Error(`Dependency graph already contains a node for plugin "${loadedPlugin.meta.name}"`);
        }

        this.depGraph.addNode(loadedPlugin.meta.name, loadedPlugin);
    }

    private static addDependency(from: string, depName: string, depVersion: string): string {
        // Check if dependecy even exists in graph
        if (!this.depGraph.hasNode(depName)) {
            Logger.error({
                msg: 'Required plugin dependency not found. Removing nodes in dependency chain',
                pluginName: from,
                requiredDep: depName,
                requiredDepVersion: depVersion
            });

            this.depGraph.addNode(depName);
            this.depGraph.addDependency(from, depName);

            return depName;
        }

        // Check if version is correct
        const { meta } = this.depGraph.getNodeData(depName);
        if (!semverSatisfies(meta.version, depVersion)) {
            Logger.error({
                msg: `Required plugin dependency found but wrong version. Removing all nodes dependant on "${from}"`,
                pluginName: from,
                requiredDep: depName,
                requiredDepVersion: depVersion,
                foundVersion: meta.version
            });

            return from;
        }

        // Add dep to graph
        this.depGraph.addDependency(from, depName);

        return null;
    }

    private static addOptionalDependency(from: string, depName: string, depVersion: string) {
        if (!this.depGraph.hasNode(depName)) {
            Logger.info({
                msg: 'Optional plugin dependency not found',
                pluginName: from,
                optionalDep: depName,
                optionalDepVersion: depVersion
            });

            return;
        }

        const { meta } = this.depGraph.getNodeData(depName);
        if (!semverSatisfies(meta.version, depVersion)) {
            Logger.warn({
                msg: 'Optional plugin dependency found but wrong version. Not adding dependency!',
                pluginName: from,
                optionalDep: depName,
                optionalDepVersion: depVersion,
                foundVersion: meta.version
            });

            return;
        }

        this.depGraph.addDependency(from, depName);
    }

    private static async loadEntryFilesFromDepGraph() {
        let order: string[] = [];

        try {
            order = this.depGraph.overallOrder();
        } catch (e) {
            Logger.error({
                msg: 'Detected cyclic depdendencies. Removing all nodes in cycle',
                cycle: e.cyclePath
            });

            this.depGraph.removeDependency(e.cyclePath[e.cyclePath.length - 2], e.cyclePath[e.cyclePath.length - 1]);
            this.removeDependantsAndReload(e.cyclePath[e.cyclePath.length - 2]);

            return;
        }

        const context = createContext({
            exports: {},
            IPC_CLIENT_SERVICE_TOKEN,
            ACTION_SERVICE_TOKEN,
            TRANSFORMER_SERVICE_TOKEN,
            ELECTRON_SERVICE_TOKEN,
            STORE_SERVICE_TOKEN,
            VALIDATOR_SERVICE_TOKEN,
            IO_SERVICE_TOKEN,
        });

        for (const node of order) {
            const loadedPlugin = this.depGraph.getNodeData(node);
            if (!(await this.loadEntryFromFile(loadedPlugin, context))) {
                Logger.error({
                    // eslint-disable-next-line
                    msg: 'Something went wrong initializing plugin entry file. Removing all connected dependants from load chain',
                    pluginName: loadedPlugin.meta.name
                });

                await this.removeDependantsAndReload(loadedPlugin.meta.name);
            }
        }
    }

    private static removeDependants(rootNode: string) {
        const dependants = [...this.depGraph.dependantsOf(rootNode), rootNode];
        for (const dep of dependants) {
            Logger.debug(`Removing plugin "${dep}" from dep graph`);
            this.depGraph.removeNode(dep);
        }
    }

    private static async removeDependantsAndReload(rootNode: string) {
        this.removeDependants(rootNode);

        await this.loadEntryFilesFromDepGraph();
    }

    private static async loadEntryFromFile(loadedPlugin: LoadedPlugin, context: Context): Promise<boolean> {
        const { meta } = loadedPlugin;

        if (this.alreadyLoaded(meta.name)) {
            Logger.debug(`Plugin "${meta.name}" already loaded`);

            return true;
        }

        if (meta.entryFile != null) {
            const entryFilePath = join(
                this.ioService.getPluginDirectory(),
                loadedPlugin.folderName,
                meta.entryFile
            );
            const entryFile = this.ioService.loadFile(
                entryFilePath,
                ''
            );

            if (entryFile == null) {
                // Check if plugin has any dependants
                // If it does not, we don't really care what happens
                if (this.depGraph.dependantsOf(meta.name).length > 0) {
                    Logger.error({
                        msg: 'Could not load plugin entry file and plugin has depdendants',
                        pluginName: meta.name,
                        entryFilePath
                    });

                    return false;
                } else {
                    Logger.warn({
                        msg: 'Could not load plugin entry file',
                        pluginName: meta.name,
                        entryFilePath
                    });

                    return true;
                }
            } else {
                try {
                    const fileScript = new Script(entryFile);
                    fileScript.runInContext(context);

                    const plugin: Plugin = new context.Plugin();
                    // TODO: Create custom scoped injector
                    const pluginInjector = createPluginInstanceInjector(this.injector, meta.name);

                    if (await plugin.initialize(pluginInjector)) {
                        this.instantiatedPlugins.push({
                            loadedPlugin,
                            instance: plugin
                        });
                    } else {
                        // Check if plugin has any dependants
                        // If it does not, we don't really care what happens
                        if (this.depGraph.dependantsOf(meta.name).length > 0) {
                            Logger.error({
                                msg: 'Plugin init function returned false and plugin has depdendants',
                                pluginName: meta.name
                            });

                            return false;
                        } else {
                            Logger.warn({
                                msg: 'Plugin init function returned false',
                                pluginName: meta.name
                            });

                            return true;
                        }
                    }

                } catch (e) {
                    // Check if plugin has any dependants
                    // If it does not, we don't really care what happens
                    if (this.depGraph.dependantsOf(meta.name).length > 0) {
                        Logger.error({
                            msg: 'Could not run plugin entry file and plugin has depdendants',
                            pluginName: meta.name,
                            error: e.message
                        });

                        return false;
                    } else {
                        Logger.warn({
                            msg: 'Could not run plugin entry file',
                            pluginName: meta.name,
                            error: e.message
                        });

                        return true;
                    }
                }
            }
        }

        return true;
    }

    private static alreadyLoaded(pluginName: string): boolean {
        return this.instantiatedPlugins.findIndex(entry => entry.loadedPlugin.meta.name === pluginName) > -1;
    }

    private static async teardownSinglePlugin(plugin: InstantiatedPlugin): Promise<void> {
        const meta = plugin.loadedPlugin.meta;
        Logger.debug(`Trying to destroy plugin "${meta.name}"`);

        try {
            if (!await plugin.instance.destroy()) {
                Logger.error({
                    msg: 'Plugin method "destroy" returned false',
                    pluginName: meta.name
                });
            }
        } catch (e) {
            Logger.error({
                msg: 'Could not gracefully destroy plugin instance',
                pluginName: meta.name,
                error: e.message
            });
        }
    }
}
