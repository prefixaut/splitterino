import { InjectionToken } from 'lightweight-di';

import { ApplicationSettings } from '../models/application-settings';
import { IPCClientInterface, IPCServerInterface } from '../models/ipc';
import {
    ActionServiceInterface,
    ElectronServiceInterface,
    IOServiceInterface,
    StoreInterface,
    TransformerServiceInterface,
    ValidatorServiceInterface,
} from '../models/services';
import { SettingsConfigurationNamespace } from '../models/states/settings.state';
import { RootState } from '../models/store';

/*
 * General information
 */
export const SPLITTERINO_VERSION = process.env.SPLITTERINO_VERSION;

/*
 * Service constants without corresponding file
 */
export const ACTION_SERVICE_TOKEN = new InjectionToken<ActionServiceInterface>('action');
export const ELECTRON_SERVICE_TOKEN = new InjectionToken<ElectronServiceInterface>('electron');
export const IO_SERVICE_TOKEN = new InjectionToken<IOServiceInterface>('io');
export const IPC_CLIENT_SERVICE_TOKEN = new InjectionToken<IPCClientInterface>('ipc-client');
export const IPC_SERVER_SERVICE_TOKEN = new InjectionToken<IPCServerInterface>('ipc-server');
export const RUNTIME_ENVIRONMENT_TOKEN = new InjectionToken<RuntimeEnvironment>('runtime-environment');
export const SPLITTERINO_VERSION_TOKEN = new InjectionToken<string>('splitterino-version');
export const STORE_SERVICE_TOKEN = new InjectionToken<StoreInterface<RootState>>('store');
export const TRANSFORMER_SERVICE_TOKEN = new InjectionToken<TransformerServiceInterface>('transformer');
export const VALIDATOR_SERVICE_TOKEN = new InjectionToken<ValidatorServiceInterface>('validator');

export enum RuntimeEnvironment {
    BACKGROUND,
    RENDERER,
    PLUGIN,
    TESTS
}


/*
 * Default Values
 */
export const DEFAULT_TIMER_FORMAT = '(-)(h:#:)(m:#:)[s].[ddd]';
export const DEFAULT_SPLIT = {
    name: '',
    personalBest: {
        igt: {
            pauseTime: 0,
            rawTime: 0,
        },
        rta: {
            pauseTime: 0,
            rawTime: 0,
        }
    },
    overallBest: {
        igt: {
            pauseTime: 0,
            rawTime: 0,
        },
        rta: {
            pauseTime: 0,
            rawTime: 0,
        }
    },
};
export const DEFAULT_APPLICATION_SETTINGS: ApplicationSettings = {
    windowOptions: {
        width: 800,
        height: 600,
        useContentSize: true,
        title: 'Splitterino',
        frame: false,
        titleBarStyle: 'hidden',
        maximizable: false,
        minWidth: 240,
        minHeight: 60,
        center: true,
        webPreferences: {
            nodeIntegration: true
        }
    }
};

/*
 * Store namespaces/modules
 */
export const SPLITTERINO_NAMESPACE_NAME = 'splitterino';
export const PLUGINS_NAMESPACE_NAME = 'plugins';

export const CONTEXT_MENU_MODULE_NAME = 'contextMenu';
export const GAME_INFO_MODULE_NAME = 'gameInfo';
export const KEYBINDINGS_MODULE_NAME = 'keybindings';
export const META_MODULE_NAME = 'meta';
export const PLUGINS_MODULE_NAME = 'plugins';
export const SETTINGS_MODULE_NAME = 'settings';
export const SPLITS_MODULE_NAME = 'splits';
export const TIMER_MODULE_NAME = 'timer';

export const ID_HANDLER_SET_GAME_INFO_GAME_NAME = 'setGameName';
export const ID_HANDLER_SET_GAME_INFO_CATEGORY = 'setCategory';
export const ID_HANDLER_SET_GAME_INFO_LANGUAGE = 'setLanguage';
export const ID_HANDLER_SET_GAME_INFO_PLATFORM = 'setPlatform';
export const ID_HANDLER_SET_GAME_INFO_REGION = 'setRegion';
export const ID_HANDLER_APPLY_GAME_INFO_SPLITS_FILE = 'applySplitsFile';
export const ID_HANDLER_APPLY_GAME_INFO = 'applyGameInfo';

export const ID_HANDLER_SET_KEYBINDINGS_BINDINGS = 'setBindings';
export const ID_HANDLER_DISABLE_KEYBINDINGS_BINDINGS = 'disableBindings';

export const ID_HANDLER_SET_META_LAST_OPENED_SPLITS_FILES = 'setLastOpenedSplitsFiles';
export const ID_HANDLER_ADD_META_OPENED_SPLITS_FILE = 'addOpenedSplitsFile';
export const ID_HANDLER_SET_META_LAST_OPENED_TEMPLATE_FILES = 'setLastOpenedTemplateFiles';
export const ID_HANDLER_ADD_META_OPENED_TEMPLATE_FILE = 'addOpenedTemplateFile';

export const ID_HANDLER_REPLACE_PLUGINS = 'replacePlugins';
export const ID_HANDLER_ADD_PLUGIN = 'addPlugin';
export const ID_HANDLER_REMOVE_PLUGIN = 'removePlugin';
export const ID_HANDLER_ENABLE_PLUGIN = 'enablePlugin';
export const ID_HANDLER_DISABLE_PLUGIN = 'disablePlugin';

export const ID_HANDLER_MERGE_SETTINGS = 'mergeSettings';

export const ID_HANDLER_SET_SPLITS_CURRENT = 'setCurrent';
export const ID_HANDLER_SET_SPLITS_TIMING = 'setTiming';
export const ID_HANDLER_CLEAR_SPLITS_SEGMENTS = 'clearSegments';
export const ID_HANDLER_REMOVE_SPLITS_SEGMENT = 'removeSegment';
export const ID_HANDLER_ADD_SPLITS_SEGMENT = 'addSegment';
export const ID_HANDLER_SET_ALL_SPLITS_SEGMENTS = 'setAllSegments';
export const ID_HANDLER_SET_SPLITS_SEGMENT = 'setSegment';
export const ID_HANDLER_SET_SPLITS_PREVIOUS_RTA_TIME = 'setPreviousRTATime';
export const ID_HANDLER_SET_SPLITS_PREVIOUS_IGT_TIME = 'setPreviousIGTTime';
export const ID_HANDLER_DISCARDING_SPLITS_RESET = 'discardingReset';
export const ID_HANDLER_SAVING_SPLITS_RESET = 'savingReset';
export const ID_HANDLER_APPLY_SPLITS_FILE = 'applySplitsFile';

export const ID_HANDLER_SET_TIMER_START_DELAY = 'setStartDelay';
export const ID_HANDLER_SET_TIMER_STATUS = 'setStatus';

export const HANDLER_SET_GAME_INFO_GAME_NAME = `${SPLITTERINO_NAMESPACE_NAME}/${GAME_INFO_MODULE_NAME}/${ID_HANDLER_SET_GAME_INFO_GAME_NAME}`;
export const HANDLER_SET_GAME_INFO_CATEGORY = `${SPLITTERINO_NAMESPACE_NAME}/${GAME_INFO_MODULE_NAME}/${ID_HANDLER_SET_GAME_INFO_CATEGORY}`;
export const HANDLER_SET_GAME_INFO_LANGUAGE = `${SPLITTERINO_NAMESPACE_NAME}/${GAME_INFO_MODULE_NAME}/${ID_HANDLER_SET_GAME_INFO_LANGUAGE}`;
export const HANDLER_SET_GAME_INFO_PLATFORM = `${SPLITTERINO_NAMESPACE_NAME}/${GAME_INFO_MODULE_NAME}/${ID_HANDLER_SET_GAME_INFO_PLATFORM}`;
export const HANDLER_SET_GAME_INNFO_REGION = `${SPLITTERINO_NAMESPACE_NAME}/${GAME_INFO_MODULE_NAME}/${ID_HANDLER_SET_GAME_INFO_REGION}`;
export const HANDLER_APPLY_GAME_INFO_SPLITS_FILE = `${SPLITTERINO_NAMESPACE_NAME}/${GAME_INFO_MODULE_NAME}/${ID_HANDLER_APPLY_GAME_INFO_SPLITS_FILE}`;
export const HANDLER_APPLY_GAME_INFO = `${SPLITTERINO_NAMESPACE_NAME}/${GAME_INFO_MODULE_NAME}/${ID_HANDLER_APPLY_GAME_INFO}`;

export const HANDLER_SET_KEYBINDINGS_BINDINGS = `${SPLITTERINO_NAMESPACE_NAME}/${KEYBINDINGS_MODULE_NAME}/${ID_HANDLER_SET_KEYBINDINGS_BINDINGS}`;
export const HANDLER_SET_KEYBINDINGS_DISABLE_BINDINGS = `${SPLITTERINO_NAMESPACE_NAME}/${KEYBINDINGS_MODULE_NAME}/${ID_HANDLER_DISABLE_KEYBINDINGS_BINDINGS}`;

export const HANDLER_SET_META_LAST_OPENED_SPLITS_FILES = `${SPLITTERINO_NAMESPACE_NAME}/${META_MODULE_NAME}/${ID_HANDLER_SET_META_LAST_OPENED_SPLITS_FILES}`;
export const HANDLER_ADD_META_OPENED_SPLITS_FILE = `${SPLITTERINO_NAMESPACE_NAME}/${META_MODULE_NAME}/${ID_HANDLER_ADD_META_OPENED_SPLITS_FILE}`;
export const HANDLER_SET_META_LAST_OPENED_TEMPLATE_FILES = `${SPLITTERINO_NAMESPACE_NAME}/${META_MODULE_NAME}/${ID_HANDLER_SET_META_LAST_OPENED_TEMPLATE_FILES}`;
export const HANDLER_ADD_META_OPENED_TEMPLATE_FILE = `${SPLITTERINO_NAMESPACE_NAME}/${META_MODULE_NAME}/${ID_HANDLER_ADD_META_OPENED_TEMPLATE_FILE}`;

export const HANDLER_REPLACE_PLUGINS = `${SPLITTERINO_NAMESPACE_NAME}/${PLUGINS_MODULE_NAME}/${ID_HANDLER_REPLACE_PLUGINS}`;
export const HANDLER_ADD_PLUGIN = `${SPLITTERINO_NAMESPACE_NAME}/${PLUGINS_MODULE_NAME}/${ID_HANDLER_ADD_PLUGIN}`;
export const HANDLER_REMOVE_PLUGIN = `${SPLITTERINO_NAMESPACE_NAME}/${PLUGINS_MODULE_NAME}/${ID_HANDLER_REMOVE_PLUGIN}`;
export const HANDLER_ENABLE_PLUGIN = `${SPLITTERINO_NAMESPACE_NAME}/${PLUGINS_MODULE_NAME}/${ID_HANDLER_ENABLE_PLUGIN}`;
export const HANDLER_DISABLE_PLUGIN = `${SPLITTERINO_NAMESPACE_NAME}/${PLUGINS_MODULE_NAME}/${ID_HANDLER_DISABLE_PLUGIN}`;

export const HANDLER_MERGE_SETTINGS = `${SPLITTERINO_NAMESPACE_NAME}/${SETTINGS_MODULE_NAME}/${ID_HANDLER_MERGE_SETTINGS}`;

export const HANDLER_SET_SPLITS_CURRENT = `${SPLITTERINO_NAMESPACE_NAME}/${SPLITS_MODULE_NAME}/${ID_HANDLER_SET_SPLITS_CURRENT}`;
export const HANDLER_SET_SPLITS_TIMING = `${SPLITTERINO_NAMESPACE_NAME}/${SPLITS_MODULE_NAME}/${ID_HANDLER_SET_SPLITS_TIMING}`;
export const HANDLER_CLEAR_SPLITS_SEGMENTS = `${SPLITTERINO_NAMESPACE_NAME}/${SPLITS_MODULE_NAME}/${ID_HANDLER_CLEAR_SPLITS_SEGMENTS}`;
export const HANDLER_REMOVE_SPLITS_SEGMENT = `${SPLITTERINO_NAMESPACE_NAME}/${SPLITS_MODULE_NAME}/${ID_HANDLER_REMOVE_SPLITS_SEGMENT}`;
export const HANDLER_ADD_SPLITS_SEGMENT = `${SPLITTERINO_NAMESPACE_NAME}/${SPLITS_MODULE_NAME}/${ID_HANDLER_ADD_SPLITS_SEGMENT}`;
export const HANDLER_SET_ALL_SPLITS_SEGMENTS = `${SPLITTERINO_NAMESPACE_NAME}/${SPLITS_MODULE_NAME}/${ID_HANDLER_SET_ALL_SPLITS_SEGMENTS}`;
export const HANDLER_SET_SPLITS_SEGMENT = `${SPLITTERINO_NAMESPACE_NAME}/${SPLITS_MODULE_NAME}/${ID_HANDLER_SET_SPLITS_SEGMENT}`;
export const HANDLER_SET_SPLITS_PREVIOUS_RTA_TIME = `${SPLITTERINO_NAMESPACE_NAME}/${SPLITS_MODULE_NAME}/${ID_HANDLER_SET_SPLITS_PREVIOUS_RTA_TIME}`;
export const HANDLER_SET_SPLITS_PREVIOUS_IGT_TIME = `${SPLITTERINO_NAMESPACE_NAME}/${SPLITS_MODULE_NAME}/${ID_HANDLER_SET_SPLITS_PREVIOUS_IGT_TIME}`;
export const HANDLER_DISCARDING_SPLITS_RESET = `${SPLITTERINO_NAMESPACE_NAME}/${SPLITS_MODULE_NAME}/${ID_HANDLER_DISCARDING_SPLITS_RESET}`;
export const HANDLER_SAVING_SPLITS_RESET = `${SPLITTERINO_NAMESPACE_NAME}/${SPLITS_MODULE_NAME}/${ID_HANDLER_SAVING_SPLITS_RESET}`;
export const HANDLER_APPLY_SPLITS_FILE = `${SPLITTERINO_NAMESPACE_NAME}/${SPLITS_MODULE_NAME}/${ID_HANDLER_APPLY_SPLITS_FILE}`;

export const HANDLER_SET_TIMER_START_DELAY = `${SPLITTERINO_NAMESPACE_NAME}/${TIMER_MODULE_NAME}/${ID_HANDLER_SET_TIMER_START_DELAY}`;
export const HANDLER_SET_TIMER_STATUS = `${SPLITTERINO_NAMESPACE_NAME}/${TIMER_MODULE_NAME}/${ID_HANDLER_SET_TIMER_STATUS}`;

/*
 * Routes
 */
export const DEFAULT_ROUTE = '/default';
export const DEFAULT_ROUTE_NAME = 'default';

export const KEYBINDINGS_ROUTE = '/keybindings';
export const KEYBINDINGS_ROUTE_NAME = 'keybindings';

export const SETTINGS_ROUTE = '/settings';
export const SETTINGS_ROUTE_NAME = 'settings';

export const SPLITS_EDITOR_ROUTE = '/splits-editor';
export const SPLITS_EDITOR_ROUTE_NAME = 'splits-editor';

export const OPEN_SPLITS_ROUTE = '/open-splits';
export const OPEN_SPLITS_ROUTE_NAME = 'open-splits';

export const OPEN_TEMPLATE_ROUTE = '/open-template';
export const OPEN_TEMPLATE_ROUTE_NAME = 'open-template';

export const PLUGIN_MANAGER_ROUTE = '/plugin-manager';
export const PLUGIN_MANAGER_ROUTE_NAME = 'plugin-manager';

/*
 * Global Event names
 */
export const GLOBAL_EVENT_LOAD_TEMPLATE = 'load-template';

/*
 * Context Menu
 */
export const CTX_MENU_WINDOW_RELOAD = 'core.window.reload';
export const CTX_MENU_WINDOW_CLOSE = 'core.window.close';

export const CTX_MENU_SPLITS_EDIT = 'core.splits.edit';
export const CTX_MENU_SPLITS_LOAD_FROM_FILE = 'core.splits.load-from-file';
export const CTX_MENU_SPLITS_SAVE_TO_FILE = 'core.splits.save-to-file';

export const CTX_MENU_SETTINGS_OPEN = 'core.settings.open';
export const CTX_MENU_PLUGIN_MANAGER_OPEN = 'core.plugin-manager.open';
export const CTX_MENU_KEYBINDINGS_OPEN = 'core.keybindings.open';

export const CTX_MENU_TEMPLATES_LOAD_FROM_FILE = 'core.templates.load-from-file';

/*
 * Keybindings
 */
export const KEYBINDING_SPLITS_SPLIT = 'core.splits.split';
export const KEYBINDING_SPLITS_SKIP = 'core.splits.skip';
export const KEYBINDING_SPLITS_UNDO = 'core.splits.undo';
export const KEYBINDING_SPLITS_TOGGLE_PAUSE = 'core.splits.toggle-pause';
export const KEYBINDING_SPLITS_RESET = 'core.splits.reset';

/*
 * IPC (Inter Process Commuinication)
 */
export const IPC_SERVER_NAME = 'flamingo';
export const IPC_PLUGIN_CLIENT_NAME = 'plugin-process';

export const IPC_PUBLISHER_SUBSCRIBER_ADDRESS = 'tcp://127.0.0.1:3730';
export const IPC_ROUTER_DEALER_ADDRESS = 'tcp://127.0.0.1:3731';
export const IPC_PULL_PUSH_ADDRESS = 'tcp://127.0.0.1:3732';

/*
 * Settings
 */
export const SETTINGS_NAMESPACE_CORE = 'core';

export const SETTINGS_GROUP_SPLITS = 'splits';
export const SETTINGS_GROUP_TIMER = 'timer';
export const SETTINGS_GROUP_APP = 'app';

export const SETTING_ID_PIN_LAST_SEGMENT = 'pinLastSegment';
export const SETTING_ID_VISIBLE_UPCOMING_SEGMENTS = 'visibleUpcomingSegments';
export const SETTING_ID_VISIBLE_PREVIOUS_SEGMENTS = 'visiblePreviousSegments';
export const SETTING_ID_SEGMENT_TIME_FORMAT = 'segmentTimeFormat';
export const SETTING_ID_COMPARISON_TIME_FORMAT = 'comparisonTimeFormat';

export const SETTING_ID_FORMAT = 'format';

export const SETTING_ID_SHOW_TITLE_BAR = 'showTitleBar';

export const CORE_SETTINGS: SettingsConfigurationNamespace = {
    key: SETTINGS_NAMESPACE_CORE,
    label: 'Core',
    groups: [
        {
            key: SETTINGS_GROUP_SPLITS,
            label: 'Splits',
            settings: [
                {
                    key: SETTING_ID_PIN_LAST_SEGMENT,
                    label: 'Pin the last Segment',
                    component: 'spl-checkbox',
                    componentProps: {},
                    defaultValue: false,
                },
                {
                    key: SETTING_ID_VISIBLE_UPCOMING_SEGMENTS,
                    label: 'Visible upcoming Segments',
                    component: 'spl-number-input',
                    componentProps: {},
                    defaultValue: 2,
                },
                {
                    key: SETTING_ID_VISIBLE_PREVIOUS_SEGMENTS,
                    label: 'Visible previous Segments',
                    component: 'spl-number-input',
                    componentProps: {},
                    defaultValue: 1,
                },
                {
                    key: SETTING_ID_SEGMENT_TIME_FORMAT,
                    label: 'Segment Time Format',
                    component: 'spl-aevum-format-input',
                    componentProps: {},
                    defaultValue: DEFAULT_TIMER_FORMAT,
                },
                {
                    key: SETTING_ID_COMPARISON_TIME_FORMAT,
                    label: 'Segment Comparison Format',
                    component: 'spl-aevum-format-input',
                    componentProps: {},
                    defaultValue: DEFAULT_TIMER_FORMAT,
                },
            ]
        },
        {
            key: SETTINGS_GROUP_TIMER,
            label: 'Timer',
            settings: [
                {
                    key: SETTING_ID_FORMAT,
                    label: 'Format',
                    component: 'spl-aevum-format-input',
                    componentProps: {},
                    defaultValue: DEFAULT_TIMER_FORMAT,
                },
            ]
        },
        {
            key: SETTINGS_GROUP_APP,
            label: 'Application',
            settings: [
                {
                    key: SETTING_ID_SHOW_TITLE_BAR,
                    label: 'Show Title Bar',
                    component: 'spl-checkbox',
                    componentProps: {},
                    defaultValue: true,
                },
            ]
        },
    ]
};

export const SETTING_SPLITS_PIN_LAST_SEGMENT = `${SETTINGS_NAMESPACE_CORE}.${SETTINGS_GROUP_SPLITS}.${SETTING_ID_PIN_LAST_SEGMENT}`;
export const SETTING_SPLITS_VISIBLE_UPCOMING_SEGMENTS = `${SETTINGS_NAMESPACE_CORE}.${SETTINGS_GROUP_SPLITS}.${SETTING_ID_VISIBLE_UPCOMING_SEGMENTS}`;
export const SETTING_SPLITS_VISIBLE_PREVIOUS_SEGMENTS = `${SETTINGS_NAMESPACE_CORE}.${SETTINGS_GROUP_SPLITS}.${SETTING_ID_VISIBLE_PREVIOUS_SEGMENTS}`;
export const SETTING_SPLITS_SEGMENT_TIME_FORMAT = `${SETTINGS_NAMESPACE_CORE}.${SETTINGS_GROUP_SPLITS}.${SETTING_ID_SEGMENT_TIME_FORMAT}`;
export const SETTING_SPLITS_COMPARISON_TIME_FORMAT = `${SETTINGS_NAMESPACE_CORE}.${SETTINGS_GROUP_SPLITS}.${SETTING_ID_COMPARISON_TIME_FORMAT}`;
export const SETTING_TIMER_FORMAT = `${SETTINGS_NAMESPACE_CORE}/${SETTINGS_GROUP_TIMER}/${SETTING_ID_FORMAT}`;
export const SETTING_APP_SHOW_TITLE_BAR = `${SETTINGS_NAMESPACE_CORE}/${SETTINGS_GROUP_APP}/${SETTING_ID_SHOW_TITLE_BAR}`;
