import { IO_SERVICE_TOKEN } from '../models/services';
import { join } from 'path';
import { Logger } from '../utils/logger';
import { Context, Script } from 'vm';
import { satisfies as semverSatisfies } from 'semver';
import { Plugin } from '../models/plugins';
import { Injector } from 'lightweight-di';
import { PluginMetaFile } from '../models/files';

interface LoadedPlugin {
    meta: PluginMetaFile;
    instance: Plugin;
}

export class PluginManager {
    public static loadedPlugins: LoadedPlugin[] = [];

    public static async loadPluginsIntoContext(injector: Injector, context: Context) {
        Logger.trace('Loading plugin meta files from directory');

        const ioService = injector.get(IO_SERVICE_TOKEN);
        const metaFiles = ioService.loadPluginMetaFiles();

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

            if (meta.entryFile != null) {
                const entryFile = ioService.loadFile(
                    meta.entryFile,
                    join(ioService.getPluginDirectory(), meta.folderName)
                );

                if (entryFile == null) {
                    Logger.warn(`Could not load entry file "${meta.entryFile}" for plugin "${meta.name}"`);
                } else {
                    try {
                        const fileScript = new Script(entryFile);
                        fileScript.runInContext(context);

                        const plugin: Plugin = new context.Plugin();
                        // TODO: Create custom scoped injector
                        if (await plugin.initialize(injector)) {
                            this.loadedPlugins.push({
                                meta,
                                instance: plugin
                            });
                        } else {
                            throw new Error('Plugin init function returned false');
                        }

                    } catch (e) {
                        Logger.error({
                            msg: `Could not load plugin file "${meta.entryFile}" for plugin ${meta.name}`,
                            error: e.message
                        });
                    }
                }
            }
        }

        Logger.info('Initialized all compatible plugins');
    }

    public static async teardown() {
        const teardownFunctions: Promise<void>[] = [];

        for (const plugin of this.loadedPlugins) {
            teardownFunctions.push(this.teardownSinglePlugin(plugin));
        }

        return Promise.all(teardownFunctions);
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
