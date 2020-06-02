import { IOServiceInterface } from '../models/services';
import { join } from 'path';
import { Logger } from '../utils/logger';
import { Context, Script } from 'vm';

// TODO: Fix return type to be Plugin instance array
export async function loadPluginsIntoContext(ioService: IOServiceInterface, context: Context): Promise<any[]> {
    const metaFiles = ioService.loadPluginMetaFiles();
    const pluginInsances: any[] = [];

    for (const meta of metaFiles) {
        if (
            meta.entryFile == null &&
            (meta.components == null || meta.components.length === 0)
        ) {
            Logger.warn(`Plugin "${meta.name}" does not contain a reference to an entry file or component`);
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

    return pluginInsances;
}
