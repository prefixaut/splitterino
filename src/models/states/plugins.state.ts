import { PluginMetaFile } from '../files';

export enum PluginStatus {
    VALID,
    NO_ENTRY_OR_COMPONENT,
    INCOMPATIBLE_VERSION
}

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
    status: PluginStatus;
}

export interface PluginsState {
    pluginList: LoadedPlugin[];
    enabledPlugins: PluginIdentifier[];
}
