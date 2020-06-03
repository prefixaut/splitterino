import { IO_SERVICE_TOKEN, IOServiceInterface } from '../models/services';
import { join } from 'path';
import { Logger } from '../utils/logger';
import { Context, Script, createContext } from 'vm';
import { satisfies as semverSatisfies } from 'semver';
import { Plugin } from '../models/plugins';
import { Injector } from 'lightweight-di';
import { PluginMetaFile } from '../models/files';
import { DepGraph } from 'dependency-graph';

interface LoadedPlugin {
    meta: PluginMetaFile;
    instance: Plugin;
}

export class PluginManager {
    private static loadedPlugins: LoadedPlugin[] = [];
    private static depGraph: DepGraph<PluginMetaFile>;
    private static ioService: IOServiceInterface;
    private static injector: Injector;

    public static async loadPluginsIntoContext(injector: Injector) {

        Logger.trace('Loading plugin meta files from directory');

        this.injector = injector;
        this.ioService = injector.get(IO_SERVICE_TOKEN);
        const metaFiles = this.ioService.loadPluginMetaFiles();
        const validMetaFiles: PluginMetaFile[] = [];
        this.depGraph = new DepGraph();
        const nodesMarkedForRemoval: string[] = [];

        Logger.debug('Loaded plugin meta files from directy. Starting initialization...');

        for (const meta of metaFiles) {
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

            this.addToDepGraph(meta);
            validMetaFiles.push(meta);
        }

        for (const meta of validMetaFiles) {
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

        Logger.info('Initialized all compatible plugins');
        if (this.loadedPlugins.length > 0) {
            Logger.info({
                msg: 'List of loaded plugins',
                plugins: this.loadedPlugins.map(pl => {
                    return {
                        [pl.meta.name]: pl.meta.version
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
        const teardownFunctions: Promise<void>[] = [];

        for (const plugin of this.loadedPlugins) {
            teardownFunctions.push(this.teardownSinglePlugin(plugin));
        }

        return Promise.all(teardownFunctions);
    }

    private static addToDepGraph(metaFile: PluginMetaFile) {
        if (this.depGraph.hasNode(metaFile.name)) {
            // TODO: Do better error handling like removing older version etc.
            throw new Error(`Dependency graph already contains a node for plugin "${metaFile.name}"`);
        }

        this.depGraph.addNode(metaFile.name, metaFile);
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
        const nodeInfo = this.depGraph.getNodeData(depName);
        if (!semverSatisfies(nodeInfo.version, depVersion)) {
            Logger.error({
                msg: `Required plugin dependency found but wrong version. Removing all nodes dependant on "${from}"`,
                pluginName: from,
                requiredDep: depName,
                requiredDepVersion: depVersion,
                foundVersion: nodeInfo.version
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

        const nodeInfo = this.depGraph.getNodeData(depName);
        if (!semverSatisfies(nodeInfo.version, depVersion)) {
            Logger.warn({
                msg: 'Optional plugin dependency found but wrong version. Not adding dependency!',
                pluginName: from,
                optionalDep: depName,
                optionalDepVersion: depVersion,
                foundVersion: nodeInfo.version
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

        const context = createContext({ exports: {} });

        for (const node of order) {
            const meta = this.depGraph.getNodeData(node);
            if (!(await this.loadEntryFromFile(meta, context))) {
                Logger.error({
                    // eslint-disable-next-line
                    msg: 'Something went wrong initializing plugin entry file. Removing all connected dependants from load chain',
                    pluginName: meta.name
                });

                await this.removeDependantsAndReload(meta.name);
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

    private static async loadEntryFromFile(metaFile: PluginMetaFile, context: Context): Promise<boolean> {
        if (this.alreadyLoaded(metaFile.name)) {
            Logger.debug(`Plugin "${metaFile.name}" already loaded`);

            return true;
        }

        if (metaFile.entryFile != null) {
            const entryFilePath = join(this.ioService.getPluginDirectory(), metaFile.folderName, metaFile.entryFile);
            const entryFile = this.ioService.loadFile(
                entryFilePath,
                ''
            );

            if (entryFile == null) {
                // Check if plugin has any dependants
                // If it does not, we don't really care what happens
                if (this.depGraph.dependantsOf(metaFile.name).length > 0) {
                    Logger.error({
                        msg: 'Could not load plugin entry file and plugin has depdendants',
                        pluginName: metaFile.name,
                        entryFilePath
                    });

                    return false;
                } else {
                    Logger.warn({
                        msg: 'Could not load plugin entry file',
                        pluginName: metaFile.name,
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
                    if (await plugin.initialize(this.injector)) {
                        this.loadedPlugins.push({
                            meta: metaFile,
                            instance: plugin
                        });
                    } else {
                        // Check if plugin has any dependants
                        // If it does not, we don't really care what happens
                        if (this.depGraph.dependantsOf(metaFile.name).length > 0) {
                            Logger.error({
                                msg: 'Plugin init function returned false and plugin has depdendants',
                                pluginName: metaFile.name
                            });

                            return false;
                        } else {
                            Logger.warn({
                                msg: 'Plugin init function returned false',
                                pluginName: metaFile.name
                            });

                            return true;
                        }
                    }

                } catch (e) {
                    // Check if plugin has any dependants
                    // If it does not, we don't really care what happens
                    if (this.depGraph.dependantsOf(metaFile.name).length > 0) {
                        Logger.error({
                            msg: 'Could not run plugin entry file and plugin has depdendants',
                            pluginName: metaFile.name
                        });

                        return false;
                    } else {
                        Logger.warn({
                            msg: 'Could not run plugin entry file',
                            pluginName: metaFile.name
                        });

                        return true;
                    }
                }
            }
        }

        return true;
    }

    private static alreadyLoaded(pluginName: string): boolean {
        return this.loadedPlugins.findIndex(entry => entry.meta.name === pluginName) > -1;
    }

    private static async teardownSinglePlugin(plugin: LoadedPlugin): Promise<void> {
        Logger.debug(`Trying to destroy plugin "${plugin.meta.name}"`);

        try {
            if(!await plugin.instance.destroy()) {
                throw new Error(`Method "destroy" for plugin "${plugin.meta.name}" returned false`);
            }
        } catch (e) {
            Logger.error({
               msg: `Could not gracefully destroy plugin instance for "${plugin.meta.name}"`,
               error: e.message
            });
        }
    }
}
