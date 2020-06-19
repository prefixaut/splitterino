import { PLUGINS_MODULE_NAME, SPLITTERINO_NAMESPACE_NAME } from '../../common/constants';
import { LoadedPlugin, PluginIdentifier, PluginsState } from '../../models/states/plugins.state';
import { Module } from '../../models/store';

const MODULE_PATH = `${SPLITTERINO_NAMESPACE_NAME}/${PLUGINS_MODULE_NAME}`;

export const ID_HANDLER_REPLACE_PLUGINS = 'replacePlugins';
export const ID_HANDLER_ADD_PLUGIN = 'addPlugin';
export const ID_HANDLER_REMOVE_PLUGIN = 'removePlugin';
export const ID_HANDLER_ENABLE_PLUGIN = 'enablePlugin';
export const ID_HANDLER_DISABLE_PLUGIN = 'disablePlugin';

export const HANDLER_REPLACE_PLUGINS = `${MODULE_PATH}/${ID_HANDLER_REPLACE_PLUGINS}`;
export const HANDLER_ADD_PLUGIN = `${MODULE_PATH}/${ID_HANDLER_ADD_PLUGIN}`;
export const HANDLER_REMOVE_PLUGIN = `${MODULE_PATH}/${ID_HANDLER_REMOVE_PLUGIN}`;
export const HANDLER_ENABLE_PLUGIN = `${MODULE_PATH}/${ID_HANDLER_ENABLE_PLUGIN}`;
export const HANDLER_DISABLE_PLUGIN = `${MODULE_PATH}/${ID_HANDLER_DISABLE_PLUGIN}`;

export function getPluginStoreModule(): Module<PluginsState> {
    return {
        initialize() {
            return {
                pluginList: [],
                enabledPlugins: [],
            };
        },
        handlers: {
            [ID_HANDLER_REPLACE_PLUGINS](state: PluginsState, loadedPlugins: LoadedPlugin[]) {
                if (loadedPlugins == null) {
                    return {};
                }

                return {
                    pluginList: loadedPlugins
                };
            },
            [ID_HANDLER_ADD_PLUGIN](state: PluginsState, loadedPlugin: LoadedPlugin) {
                if (state.pluginList.findIndex(
                    plugin => {
                        const loadedMeta = loadedPlugin.meta;
                        const pluginMeta = plugin.meta;

                        return pluginMeta.name === loadedMeta.name && pluginMeta.version === loadedMeta.version;
                    }
                ) === -1) {
                    return {};
                }

                return {
                    pluginList: [
                        ...state.pluginList,
                        loadedPlugin,
                    ]
                };
            },
            [ID_HANDLER_REMOVE_PLUGIN](state: PluginsState, identifier: PluginIdentifier) {
                // If the plugin isn't registered yet, ignore the request
                // TODO: Move this and other to helper function to stay DRY
                const index = state.pluginList.findIndex(
                    plugin => plugin.meta.name === identifier.name && plugin.meta.version === identifier.version
                );
                if (index > -1) {
                    return {};
                }

                // See if the plugin is enabled
                const enabledIndex = state.enabledPlugins.findIndex(
                    plugin => plugin.name === identifier.name && plugin.version === identifier.version
                );

                const result: Partial<PluginsState> = {
                    pluginList: [
                        ...state.pluginList.slice(0, index),
                        ...state.pluginList.slice(index + 1),
                    ]
                };

                // If it's enabled, then also disable it
                if (enabledIndex > -1) {
                    result.enabledPlugins = [
                        ...state.enabledPlugins.slice(0, enabledIndex),
                        ...state.enabledPlugins.slice(enabledIndex + 1),
                    ];
                }

                return result;
            },
            [ID_HANDLER_ENABLE_PLUGIN](state: PluginsState, identifier: PluginIdentifier) {
                // If the plugin isn't registered or already enabled, ignore the request
                if (state.pluginList.findIndex(
                    plugin => plugin.meta.name === identifier.name && plugin.meta.version === identifier.version
                ) === -1 || state.enabledPlugins.findIndex(
                    plugin => plugin.name === identifier.name && plugin.version === identifier.version
                ) !== -1) {
                    return {};
                }

                return {
                    enabledPlugins: [
                        ...state.enabledPlugins,
                        identifier,
                    ],
                };
            },
            [ID_HANDLER_DISABLE_PLUGIN](state: PluginsState, identifier: PluginIdentifier) {
                // If the plugin isn't enabled yet ignore it
                if (state.pluginList.findIndex(
                    plugin => plugin.meta.name === identifier.name && plugin.meta.version === identifier.version
                ) === -1) {
                    return {};
                }

                // Can't disable the plugin if it isn't enabled
                const index = state.enabledPlugins.findIndex(
                    plugin => plugin.name === identifier.name && plugin.version === identifier.version
                );

                if (index === -1) {
                    return {};
                }

                return {
                    enabledPlugins: [
                        ...state.enabledPlugins.slice(0, index),
                        ...state.enabledPlugins.slice(index + 1),
                    ]
                };
            }
        }
    };
}
