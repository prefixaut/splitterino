import {
    ID_HANDLER_ADD_PLUGIN,
    ID_HANDLER_DISABLE_PLUGIN,
    ID_HANDLER_ENABLE_PLUGIN,
    ID_HANDLER_REMOVE_PLUGIN,
    ID_HANDLER_REPLACE_LOADED_PLUGINS,
    VALIDATOR_SERVICE_TOKEN,
    ID_HANDLER_REPLACE_ENABLED_PLUGINS,
} from '../../common/constants';
import { ValidatorServiceInterface } from '../../models/services';
import { LoadedPlugin, PluginIdentifier, PluginsState } from '../../models/states/plugins.state';
import { Module } from '../../models/store';

export function getPluginStoreModule(injector): Module<PluginsState> {
    const validator = injector.get(VALIDATOR_SERVICE_TOKEN) as ValidatorServiceInterface;

    return {
        initialize() {
            return {
                pluginList: [],
                enabledPlugins: [],
            };
        },
        handlers: {
            [ID_HANDLER_REPLACE_LOADED_PLUGINS](state: PluginsState, loadedPlugins: LoadedPlugin[]) {
                if (loadedPlugins == null) {
                    return {};
                }

                return {
                    pluginList: loadedPlugins
                };
            },
            [ID_HANDLER_REPLACE_ENABLED_PLUGINS](state: PluginsState, enabledPlugins: PluginIdentifier[]) {
                if (enabledPlugins == null) {
                    return {};
                }

                return {
                    enabledPlugins
                };
            },
            [ID_HANDLER_ADD_PLUGIN](state: PluginsState, loadedPlugin: LoadedPlugin) {
                if (!validator.isPluginMetaFile(loadedPlugin.meta)) {
                    return {};
                }

                if (isPluginRegisteredGetter(state)(loadedPlugin.meta)) {
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
                // If the plugin isn't registered yet, ignore it
                const index = registeredPluginIndexGetter(state)(identifier);
                if (index > -1) {
                    return {};
                }

                // See if the plugin is enabled
                const enabledIndex = enabledPluginIndexGetter(state)(identifier);

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
                if (!isPluginRegisteredGetter(state)(identifier) || isPluginEnabledGetter(state)(identifier)) {
                    return {};
                }

                return {
                    enabledPlugins: [
                        ...state.enabledPlugins,
                        {
                            name: identifier.name,
                            version: identifier.version,
                        }
                    ],
                };
            },
            [ID_HANDLER_DISABLE_PLUGIN](state: PluginsState, identifier: PluginIdentifier) {
                // If the plugin isn't registered yet, ignore it
                if (!isPluginRegisteredGetter(state)(identifier)) {
                    return {};
                }

                // Can't disable the plugin if it isn't enabled
                const index = enabledPluginIndexGetter(state)(identifier);

                if (index === -1) {
                    return {};
                }

                const r = {
                    enabledPlugins: [
                        ...state.enabledPlugins.slice(0, index),
                        ...state.enabledPlugins.slice(index + 1),
                    ]
                };

                return r;
            }
        }
    };
}

export function registeredPluginIndexGetter(state: PluginsState) {
    return (identifier: PluginIdentifier) =>
        state.pluginList.findIndex(
            plugin => plugin.meta.name === identifier.name && plugin.meta.version === identifier.version
        );
}

export function isPluginRegisteredGetter(state: PluginsState) {
    return (identifier: PluginIdentifier) => registeredPluginIndexGetter(state)(identifier) !== -1;
}

export function enabledPluginIndexGetter(state: PluginsState) {
    return (identifier: PluginIdentifier) =>
        state.enabledPlugins.findIndex(
            plugin => plugin.name === identifier.name && plugin.version === identifier.version
        );
}

export function isPluginEnabledGetter(state: PluginsState) {
    return (identifier: PluginIdentifier) => enabledPluginIndexGetter(state)(identifier) !== -1;
}
