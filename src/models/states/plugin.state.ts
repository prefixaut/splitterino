import { PluginMetaFile } from '../files';

export interface PluginIdentifier {
    name: string;
    version: string;
}

export interface PluginState {
    pluginList: PluginMetaFile[];
    enabledPlugins: PluginIdentifier[];
}
