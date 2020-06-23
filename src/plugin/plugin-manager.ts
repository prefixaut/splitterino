import { DepGraph } from 'dependency-graph';
import { Injector } from 'lightweight-di';
import { join } from 'path';
import { filter, map } from 'rxjs/operators';
import { satisfies as semverSatisfies } from 'semver';
import { Context, createContext, Script } from 'vm';

import {
    ACTION_SERVICE_TOKEN,
    ELECTRON_SERVICE_TOKEN,
    HANDLER_DISABLE_PLUGIN,
    HANDLER_REPLACE_ENABLED_PLUGINS,
    IO_SERVICE_TOKEN,
    IPC_CLIENT_SERVICE_TOKEN,
    STORE_SERVICE_TOKEN,
    TRANSFORMER_SERVICE_TOKEN,
    VALIDATOR_SERVICE_TOKEN,
} from '../common/constants';
import { Dependencies } from '../models/files';
import { MessageType, PluginProcessManagementRequest } from '../models/ipc';
import { Plugin } from '../models/plugins';
import { IOServiceInterface, StoreInterface } from '../models/services';
import { LoadedPlugin, PluginIdentifier, PluginStatus } from '../models/states/plugins.state';
import { RootState } from '../models/store';
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
    private static store: StoreInterface<RootState>;
    private static injector: Injector;

    public static init(injector: Injector) {
        this.injector = injector;
        this.ioService = injector.get(IO_SERVICE_TOKEN);
        this.store = injector.get(STORE_SERVICE_TOKEN);
    }

    public static async loadPluginsIntoContext() {

        Logger.trace('Loading plugin meta files from directory');

        const validPlugins: LoadedPlugin[] = this.ioService.loadPluginFiles().filter(
            plugin => plugin.status === PluginStatus.VALID
        );
        const enabledPlugins: LoadedPlugin[] = [];
        this.depGraph = new DepGraph();
        const nodesMarkedForRemoval: string[] = [];

        Logger.debug('Loaded plugin meta files from directy. Starting initialization...');

        for (const enabledPlugin of this.store.state.splitterino.plugins.enabledPlugins) {
            const plugin = validPlugins.find(
                validP => validP.meta.name === enabledPlugin.name && validP.meta.version === enabledPlugin.version
            );

            if (plugin == null) {
                Logger.warn({
                    msg: 'Enabled plugin was not found in valid loaded plugin list. Skipping load',
                    plugin: enabledPlugin
                });
                continue;
            }

            enabledPlugins.push(plugin);
        }

        for (const plugin of enabledPlugins) {
            this.addToDepGraph(plugin);
        }

        for (const enabledPlugin of enabledPlugins) {
            const { meta } = enabledPlugin;
            // Required deps
            nodesMarkedForRemoval.concat(this.addDependencies(meta.name, meta.optionalDependencies));

            // Optional deps
            this.addOptionalDependencies(meta.name, meta.optionalDependencies);
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

        this.store.commit(
            HANDLER_REPLACE_ENABLED_PLUGINS,
            this.instantiatedPlugins.map(instance => instance.loadedPlugin)
        );

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

    public static teardown() {
        const order = this.depGraph.overallOrder().reverse();

        return this.teardownPluginList(order);
    }

    public static setupIPCHooks() {
        const ipcClient = this.injector.get(IPC_CLIENT_SERVICE_TOKEN);

        ipcClient.listenToSubscriberSocket().pipe(
            map(packet => packet.message),
            filter(message => (
                message.type === MessageType.REQUEST_ENABLE_PLUGIN ||
                message.type === MessageType.REQUEST_DISABLE_PLUGIN
            ))
        ).subscribe((request: PluginProcessManagementRequest) => {
            switch (request.type) {
                case MessageType.REQUEST_ENABLE_PLUGIN: {
                    this.enablePluginAndLoad(request.pluginId);
                    break;
                }
                case MessageType.REQUEST_DISABLE_PLUGIN: {
                    this.disablePlugin(request.pluginId);
                    break;
                }
            }
        });
    }

    private static enablePlugin(pluginId: PluginIdentifier): boolean {
        if (this.alreadyLoaded(pluginId.name)) {
            // TODO: IPC Response
            return true;
        }

        const loadedPlugin = this.store.state.splitterino.plugins.pluginList.find(
            plugin => plugin.meta.name === pluginId.name && plugin.meta.version === pluginId.version
        );

        if (loadedPlugin == null || loadedPlugin.status !== PluginStatus.VALID) {
            // TODO: IPC Response
            return false;
        }

        this.addToDepGraph(loadedPlugin);

        // Required deps
        const nodesMarkedForRemoval = this.addDependencies(
            loadedPlugin.meta.name,
            loadedPlugin.meta.optionalDependencies,
            true
        );

        // Optional deps
        this.addOptionalDependencies(loadedPlugin.meta.name, loadedPlugin.meta.optionalDependencies);

        for (const node of nodesMarkedForRemoval) {
            this.removeDependants(node);
        }

        // If there are nodes marked for removal then the plugin was not loaded correctly
        if (nodesMarkedForRemoval.length > 0) {
            // TODO: IPC Response
            return false;
        }

        this.store.commit(
            HANDLER_REPLACE_ENABLED_PLUGINS,
            this.instantiatedPlugins.map(instance => instance.loadedPlugin)
        );

        return true;
    }

    private static async enablePluginAndLoad(pluginId: PluginIdentifier) {
        if (this.enablePlugin(pluginId)) {
            // TODO: Check if plugin was loaded correctly
            // Maybe do that with a comparison of instantiatedPlugins before and after
            await this.loadEntryFilesFromDepGraph();
        }
    }

    private static async disablePlugin(pluginId: PluginIdentifier) {
        if (!this.alreadyLoaded(pluginId.name)) {
            // TODO: IPC response
            return;
        }

        const deps = this.removeDependants(pluginId.name);
        await this.teardownPluginList(deps.map(dep => dep.name));
        for (const dep of deps) {
            await this.store.commit(HANDLER_DISABLE_PLUGIN, dep);
        }

        // TODO: Send response
    }

    private static addDependencies(pluginName: string, dependencies?: Dependencies, implicitEnable = false): string[] {
        const nodesMarkedForRemoval: string[] = [];
        // eslint-disable-next-line
        let addDependenciesFunction = this.addDependency;
        if (implicitEnable) {
            // eslint-disable-next-line
            addDependenciesFunction = this.addDependencyWithEnable;
        }

        for (const [depName, depVersion] of Object.entries(dependencies ?? {})) {
            const nodeToRemove = addDependenciesFunction.call(this, pluginName, depName, depVersion);

            if (nodeToRemove != null) {
                nodesMarkedForRemoval.push(nodeToRemove);
            }
        }

        return nodesMarkedForRemoval;
    }

    /**
     * Add a list of dependencies for a plugin
     * @param pluginName Plugin to add dependecies to
     * @param dependencies Optional dependencies to add
     */
    private static addOptionalDependencies(pluginName: string, dependencies?: Dependencies) {
        for (const [depName, depVersion] of Object.entries(dependencies ?? {})) {
            this.addOptionalDependency(pluginName, depName, depVersion);
        }
    }

    /**
     * Adds a plugin as node to the dependency graph
     * @param loadedPlugin Plugin to add as node
     */
    private static addToDepGraph(loadedPlugin: LoadedPlugin) {
        if (this.depGraph.hasNode(loadedPlugin.meta.name)) {
            // TODO: Do better error handling like removing older version etc.
            throw new Error(`Dependency graph already contains a node for plugin "${loadedPlugin.meta.name}"`);
        }

        this.depGraph.addNode(loadedPlugin.meta.name, loadedPlugin);
    }

    /**
     * Tries to add a dependency of already enabled plugin
     * @param from Node that is dependant
     * @param depName Dependency name
     * @param depVersion Dependency version
     * @returns The name of the node that needs to be removed since the dependency was not found.
     * Null if added correctly
     */
    private static addDependency(from: string, depName: string, depVersion: string): string {
        // Check if dependecy even exists in graph
        if (!this.depGraph.hasNode(depName)) {
            Logger.error({
                msg: 'Required plugin dependency not found',
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

    /**
     * Tries to add a dependency of already enabled plugin. If plugin is not already enabled, try to enable it
     * @param from Node that is dependant
     * @param depName Dependency name
     * @param depVersion Dependency version
     * @returns The name of the node that needs to be removed since the dependency was not found.
     * Null if added correctly
     */
    private static addDependencyWithEnable(from: string, depName: string, depVersion: string): string {
        const nodeToRemove = this.addDependency(from, depName, depVersion);
        // If node was not loaded and is not self, try to enable dependency
        if (nodeToRemove != null && nodeToRemove !== from) {
            if (!this.enablePlugin({ name: depName, version: depVersion })) {
                return depName;
            }

            return null;
        }

        return nodeToRemove;
    }

    /**
     * Adds an optional dependency to the graph
     * @param from Node that is dependant
     * @param depName Dependency name
     * @param depVersion Dependency version
     */
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

    /**
     * Tries to load every dependency from the dependency graph in correct loading order
     */
    private static async loadEntryFilesFromDepGraph() {
        let order: string[] = [];

        // Try to get the order and detect cyclic dependecies
        try {
            order = this.depGraph.overallOrder();
        } catch (e) {
            Logger.error({
                msg: 'Detected cyclic depdendencies. Removing all nodes in cycle',
                cycle: e.cyclePath
            });

            // Remove cyclic dependencies
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

        // Load the plugins in order
        for (const node of order) {
            const loadedPlugin = this.depGraph.getNodeData(node);
            if (!(await this.loadEntryFromFile(loadedPlugin, context))) {
                Logger.error({
                    // eslint-disable-next-line
                    msg: 'Something went wrong initializing plugin entry file. Removing all connected dependants from load chain',
                    pluginName: loadedPlugin.meta.name
                });

                // Remove the plugin on error and try to resume loading
                await this.removeDependantsAndReload(loadedPlugin.meta.name);
            }
        }
    }

    /**
     * Removes root node and dependants of root node from dependency graph
     * @param rootNode Root node of depdendency chain to remove
     * @returns List of plugin identifiers that got removed
     */
    private static removeDependants(rootNode: string): PluginIdentifier[] {
        const dependants = [...this.depGraph.dependantsOf(rootNode), rootNode];
        const dependantsIdentifier: PluginIdentifier[] = [];
        for (const dep of dependants) {
            Logger.debug(`Removing plugin "${dep}" from dep graph`);
            const meta = this.depGraph.getNodeData(dep).meta;
            dependantsIdentifier.push({ name: meta.name, version: meta.version });
            this.depGraph.removeNode(dep);
        }

        return dependantsIdentifier.reverse();
    }

    /**
     * Removes dependants and tries to reload the entry files that are still valid
     * @param rootNode Node and dependants to remove
     */
    private static async removeDependantsAndReload(rootNode: string) {
        this.removeDependants(rootNode);

        await this.loadEntryFilesFromDepGraph();
    }

    /**
     * Tries to load the plugin's entry file into context and instantiate it
     * @param loadedPlugin Plugin to load entry file from
     * @param context Context to load plugin into
     */
    private static async loadEntryFromFile(loadedPlugin: LoadedPlugin, context: Context): Promise<boolean> {
        const { meta } = loadedPlugin;

        // Skip if plugin is already loaded
        if (this.alreadyLoaded(meta.name)) {
            Logger.debug(`Plugin "${meta.name}" already loaded`);

            return true;
        }

        // Check if there is an entry file
        if (meta.entryFile != null) {
            // Get the entry file path and load the contents
            const entryFilePath = join(
                this.ioService.getPluginDirectory(),
                loadedPlugin.folderName,
                meta.entryFile
            );
            const entryFile = this.ioService.loadFile(
                entryFilePath,
                ''
            );

            // Check if contents was loaded
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
                    // Try to load script into vm context
                    const fileScript = new Script(entryFile);
                    fileScript.runInContext(context);

                    // Create plugin class instance
                    const plugin: Plugin = new context.Plugin();
                    // TODO: Create custom scoped injector
                    const pluginInjector = createPluginInstanceInjector(this.injector, meta.name);

                    // Try to initialize plugin
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

    /**
     * Checks if a plugin is already instantiated by name
     * @param pluginName Name of plugin to check
     */
    private static alreadyLoaded(pluginName: string): boolean {
        return this.instantiatedPlugins.findIndex(entry => entry.loadedPlugin.meta.name === pluginName) > -1;
    }

    /**
     * Try to teardown a list of plugins identified by name
     * @param pluginList List of plugin names to tear down
     */
    private static async teardownPluginList(pluginList: string[]) {
        for (const plugin of pluginList) {
            // Look for the plugin and if found try to tear it down and remove it from instantiated plugins
            const instantiatedPluginIndex = this.instantiatedPlugins.findIndex(
                pl => pl.loadedPlugin.meta.name === plugin
            );
            if (instantiatedPluginIndex > -1) {
                await this.teardownSinglePlugin(this.instantiatedPlugins[instantiatedPluginIndex]);
                this.instantiatedPlugins.splice(instantiatedPluginIndex, 1);
            }
        }
    }

    /**
     * Tries to tear down a single instantiated plugin via a call to the plugins destroy method
     * @param plugin Plugin instance to destroy
     */
    private static async teardownSinglePlugin(plugin: InstantiatedPlugin): Promise<void> {
        const meta = plugin.loadedPlugin.meta;
        Logger.debug(`Trying to destroy plugin "${meta.name}"`);

        // Try to destroy the plugin
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
