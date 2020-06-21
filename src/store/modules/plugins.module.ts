import { PLUGINS_MODULE_NAME, SPLITTERINO_NAMESPACE_NAME } from '../../common/constants';
import { VALIDATOR_SERVICE_TOKEN, ValidatorServiceInterface } from '../../models/services';
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
            [ID_HANDLER_REPLACE_PLUGINS](state: PluginsState, loadedPlugins: LoadedPlugin[]) {
                if (loadedPlugins == null) {
                    return {};
                }

                return {
                    pluginList: loadedPlugins
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
                    console.log('plugin not registered yet or already enabled!', identifier);

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
                console.log('disabling plugin:', identifier);
                // If the plugin isn't registered yet, ignore it
                if (!isPluginRegisteredGetter(state)(identifier)) {
                    console.log('plugin is not registered, can not disabled it');

                    return {};
                }

                // Can't disable the plugin if it isn't enabled
                const index = enabledPluginIndexGetter(state)(identifier);

                if (index === -1) {
                    console.log('plugin is not enabled, can not disable it');

                    return {};
                }

                const r = {
                    enabledPlugins: [
                        ...state.enabledPlugins.slice(0, index),
                        ...state.enabledPlugins.slice(index + 1),
                    ]
                };
                console.log(r);

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
