import { ChildProcess, fork } from 'child_process';
import { Injector } from 'lightweight-di';
import { join } from 'path';
import { first, map, timeout } from 'rxjs/operators';

import {
    ACTION_SERVICE_TOKEN,
    ELECTRON_SERVICE_TOKEN,
    HANDLER_ADD_META_OPENED_SPLITS_FILE,
    HANDLER_ADD_META_OPENED_TEMPLATE_FILE,
    HANDLER_ADD_SPLITS_SEGMENT,
    HANDLER_APPLY_GAME_INFO,
    HANDLER_APPLY_GAME_INFO_SPLITS_FILE,
    HANDLER_APPLY_SPLITS_FILE,
    HANDLER_CLEAR_SPLITS_SEGMENTS,
    HANDLER_DISCARDING_SPLITS_RESET,
    HANDLER_MERGE_SETTINGS,
    HANDLER_REMOVE_SPLITS_SEGMENT,
    HANDLER_SAVING_SPLITS_RESET,
    HANDLER_SET_ALL_SPLITS_SEGMENTS,
    HANDLER_SET_GAME_INFO_CATEGORY,
    HANDLER_SET_GAME_INFO_GAME_NAME,
    HANDLER_SET_GAME_INFO_LANGUAGE,
    HANDLER_SET_GAME_INFO_PLATFORM,
    HANDLER_SET_GAME_INNFO_REGION,
    HANDLER_SET_KEYBINDINGS_BINDINGS,
    HANDLER_SET_KEYBINDINGS_DISABLE_BINDINGS,
    HANDLER_SET_META_LAST_OPENED_SPLITS_FILES,
    HANDLER_SET_META_LAST_OPENED_TEMPLATE_FILES,
    HANDLER_SET_SPLITS_CURRENT,
    HANDLER_SET_SPLITS_PREVIOUS_IGT_TIME,
    HANDLER_SET_SPLITS_PREVIOUS_RTA_TIME,
    HANDLER_SET_SPLITS_SEGMENT,
    HANDLER_SET_SPLITS_TIMING,
    HANDLER_SET_TIMER_START_DELAY,
    HANDLER_SET_TIMER_STATUS,
    IO_SERVICE_TOKEN,
    IPC_CLIENT_SERVICE_TOKEN,
    KEYBINDING_SPLITS_RESET,
    KEYBINDING_SPLITS_SKIP,
    KEYBINDING_SPLITS_SPLIT,
    KEYBINDING_SPLITS_TOGGLE_PAUSE,
    KEYBINDING_SPLITS_UNDO,
    RUNTIME_ENVIRONMENT_TOKEN,
    SETTING_APP_SHOW_TITLE_BAR,
    SETTING_SPLITS_COMPARISON_TIME_FORMAT,
    SETTING_SPLITS_PIN_LAST_SEGMENT,
    SETTING_SPLITS_SEGMENT_TIME_FORMAT,
    SETTING_SPLITS_VISIBLE_PREVIOUS_SEGMENTS,
    SETTING_SPLITS_VISIBLE_UPCOMING_SEGMENTS,
    SETTING_TIMER_FORMAT,
    SPLITTERINO_VERSION,
    SPLITTERINO_VERSION_TOKEN,
    STORE_SERVICE_TOKEN,
    TRANSFORMER_SERVICE_TOKEN,
    VALIDATOR_SERVICE_TOKEN,
} from '../common/constants';
import { IPCServerInterface, MessageType } from '../models/ipc';
import { PluginApi } from '../models/plugins';
import { RootState } from '../models/store';
import { HandlerStoreService } from '../services/handler-store.service';
import { PluginInstanceStoreService } from '../services/plugin-instance-store.service';
import { isDevelopment } from './internal';

export async function forkPluginProcess(ipcServer: IPCServerInterface): Promise<ChildProcess | null> {
    return new Promise<ChildProcess | null>((resolve, reject) => {
        let process = null;

        ipcServer.listenToRouterSocket().pipe(
            map(packet => packet.message),
            first(message => message.type === MessageType.NOTIFY_PLUGIN_PROCESS_READY),
            timeout(30_000)
        ).subscribe(() => {
            resolve(process);
        }, () => {
            reject(null);
        });

        const processPath = isDevelopment() ? 'dist_electron/plugin-process.js' : join(__dirname, 'plugin/process.js');
        process = fork(processPath);
    });
}

export function createPluginInstanceInjector(parentInjector: Injector, pluginName: string): Injector {
    return Injector.resolveAndCreate([
        ...[
            ACTION_SERVICE_TOKEN,
            ELECTRON_SERVICE_TOKEN,
            IO_SERVICE_TOKEN,
            IPC_CLIENT_SERVICE_TOKEN,
            RUNTIME_ENVIRONMENT_TOKEN,
            TRANSFORMER_SERVICE_TOKEN,
            VALIDATOR_SERVICE_TOKEN,
            SPLITTERINO_VERSION_TOKEN,
        ].map(token => {
            return {
                provide: token, useValue: parentInjector.get(token),
            };
        }),
        {
            provide: STORE_SERVICE_TOKEN,
            useValue: new PluginInstanceStoreService(
                parentInjector.get(STORE_SERVICE_TOKEN) as HandlerStoreService<RootState>,
                pluginName
            ),
        },
    ]);
}

export function createPluginApiInstance(injector: Injector): PluginApi {
    return {
        injector: injector,
        runtime: injector.get(RUNTIME_ENVIRONMENT_TOKEN),
        version: SPLITTERINO_VERSION,
        handlers: {
            SET_GAME_INFO_GAME_NAME: HANDLER_SET_GAME_INFO_GAME_NAME,
            SET_GAME_INFO_CATEGORY: HANDLER_SET_GAME_INFO_CATEGORY,
            SET_GAME_INFO_LANGUAGE: HANDLER_SET_GAME_INFO_LANGUAGE,
            SET_GAME_INFO_PLATFORM: HANDLER_SET_GAME_INFO_PLATFORM,
            SET_GAME_INNFO_REGION: HANDLER_SET_GAME_INNFO_REGION,
            APPLY_GAME_INFO_SPLITS_FILE: HANDLER_APPLY_GAME_INFO_SPLITS_FILE,
            APPLY_GAME_INFO: HANDLER_APPLY_GAME_INFO,

            SET_KEYBINDINGS_BINDINGS: HANDLER_SET_KEYBINDINGS_BINDINGS,
            SET_KEYBINDINGS_DISABLE_BINDINGS: HANDLER_SET_KEYBINDINGS_DISABLE_BINDINGS,

            SET_META_LAST_OPENED_SPLITS_FILES: HANDLER_SET_META_LAST_OPENED_SPLITS_FILES,
            ADD_META_OPENED_SPLITS_FILE: HANDLER_ADD_META_OPENED_SPLITS_FILE,
            SET_META_LAST_OPENED_TEMPLATE_FILES: HANDLER_SET_META_LAST_OPENED_TEMPLATE_FILES,
            ADD_META_OPENED_TEMPLATE_FILE: HANDLER_ADD_META_OPENED_TEMPLATE_FILE,

            MERGE_SETTINGS: HANDLER_MERGE_SETTINGS,

            SET_SPLITS_CURRENT: HANDLER_SET_SPLITS_CURRENT,
            SET_SPLITS_TIMING: HANDLER_SET_SPLITS_TIMING,
            CLEAR_SPLITS_SEGMENTS: HANDLER_CLEAR_SPLITS_SEGMENTS,
            REMOVE_SPLITS_SEGMENT: HANDLER_REMOVE_SPLITS_SEGMENT,
            ADD_SPLITS_SEGMENT: HANDLER_ADD_SPLITS_SEGMENT,
            SET_ALL_SPLITS_SEGMENTS: HANDLER_SET_ALL_SPLITS_SEGMENTS,
            SET_SPLITS_SEGMENT: HANDLER_SET_SPLITS_SEGMENT,
            SET_SPLITS_PREVIOUS_RTA_TIME: HANDLER_SET_SPLITS_PREVIOUS_RTA_TIME,
            SET_SPLITS_PREVIOUS_IGT_TIME: HANDLER_SET_SPLITS_PREVIOUS_IGT_TIME,
            DISCARDING_SPLITS_RESET: HANDLER_DISCARDING_SPLITS_RESET,
            SAVING_SPLITS_RESET: HANDLER_SAVING_SPLITS_RESET,
            APPLY_SPLITS_FILE: HANDLER_APPLY_SPLITS_FILE,

            SET_TIMER_START_DELAY: HANDLER_SET_TIMER_START_DELAY,
            SET_TIMER_STATUS: HANDLER_SET_TIMER_STATUS,
        },
        keybindings: {
            SPLITS_SPLIT: KEYBINDING_SPLITS_SPLIT,
            SPLITS_SKIP: KEYBINDING_SPLITS_SKIP,
            SPLITS_UNDO: KEYBINDING_SPLITS_UNDO,
            SPLITS_TOGGLE_PAUSE: KEYBINDING_SPLITS_TOGGLE_PAUSE,
            SPLITS_RESET: KEYBINDING_SPLITS_RESET,
        },
        settings: {
            SPLITS_PIN_LAST_SEGMENT: SETTING_SPLITS_PIN_LAST_SEGMENT,
            SPLITS_VISIBLE_UPCOMING_SEGMENTS: SETTING_SPLITS_VISIBLE_UPCOMING_SEGMENTS,
            SPLITS_VISIBLE_PREVIOUS_SEGMENTS: SETTING_SPLITS_VISIBLE_PREVIOUS_SEGMENTS,
            SPLITS_SEGMENT_TIME_FORMAT: SETTING_SPLITS_SEGMENT_TIME_FORMAT,
            SPLITS_COMPARISON_TIME_FORMAT: SETTING_SPLITS_COMPARISON_TIME_FORMAT,
            TIMER_FORMAT: SETTING_TIMER_FORMAT,
            APP_SHOW_TITLE_BAR: SETTING_APP_SHOW_TITLE_BAR,
        },
    };
}
