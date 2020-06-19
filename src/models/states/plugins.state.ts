import { PluginMetaFile } from '../files';

export interface PluginIdentifier {
    /** Plugin identification-name */
    name: string;
    /** Plugin semver */
    version: string;
}

export interface LoadedPlugin {
    meta: PluginMetaFile;
    dependants: PluginIdentifier[];
    folderName: string;
}

export interface PluginsState {
    pluginList: LoadedPlugin[];
    enabledPlugins: PluginIdentifier[];
}
