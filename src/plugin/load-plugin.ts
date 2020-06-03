import { IOServiceInterface } from '../models/services';
import { join } from 'path';
import { Logger } from '../utils/logger';
import { Context, Script } from 'vm';
import { satisfies as semverSatisfies } from 'semver';

// TODO: Fix return type to be Plugin instance array
export async function loadPluginsIntoContext(ioService: IOServiceInterface, context: Context): Promise<any[]> {
    Logger.trace('Loading plugin meta files from directory');

    const metaFiles = ioService.loadPluginMetaFiles();
    const pluginInsances: any[] = [];

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
            const entryFile = ioService.loadFile(meta.entryFile, join(ioService.getPluginDirectory(), meta.folderName));
            if (entryFile == null) {
                Logger.warn(`Could not load entry file "${meta.entryFile}" for plugin "${meta.name}"`);
            } else {
                try {
                    const fileScript = new Script(entryFile);
                    fileScript.runInContext(context);
                    const plugin = new context.Plugin();
                    if (await plugin.init()) {
                        pluginInsances.push(plugin);
                    } else {
                        throw new Error('Plugin init function returned false');
                    }
                } catch (e) {
                    Logger.error({
                        msg: `Could not load plugin file "${meta.entryFile}" for plugin ${meta.name}`,
                        error: e
                    });
                }
            }
        }
    }

    Logger.info('Initialized all compatible plugins');

    return pluginInsances;
}
