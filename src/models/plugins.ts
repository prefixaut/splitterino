import { Injector } from 'lightweight-di';

import { RuntimeEnvironment } from '../common/constants';

export interface SplitterinoPlugin {
    initialize(api: PluginApi): Promise<boolean>;
    destroy(): Promise<boolean>;
}

export interface PluginApi {
    injector: Injector;
    version: string;
    runtime: RuntimeEnvironment;
    handlers: {
        SET_GAME_INFO_GAME_NAME: string;
        SET_GAME_INFO_CATEGORY: string;
        SET_GAME_INFO_LANGUAGE: string;
        SET_GAME_INFO_PLATFORM: string;
        SET_GAME_INNFO_REGION: string;
        APPLY_GAME_INFO_SPLITS_FILE: string;
        APPLY_GAME_INFO: string;

        SET_KEYBINDINGS_BINDINGS: string;
        SET_KEYBINDINGS_DISABLE_BINDINGS: string;

        SET_META_LAST_OPENED_SPLITS_FILES: string;
        ADD_META_OPENED_SPLITS_FILE: string;
        SET_META_LAST_OPENED_TEMPLATE_FILES: string;
        ADD_META_OPENED_TEMPLATE_FILE: string;

        MERGE_SETTINGS: string;

        SET_SPLITS_CURRENT: string;
        SET_SPLITS_TIMING: string;
        CLEAR_SPLITS_SEGMENTS: string;
        REMOVE_SPLITS_SEGMENT: string;
        ADD_SPLITS_SEGMENT: string;
        SET_ALL_SPLITS_SEGMENTS: string;
        SET_SPLITS_SEGMENT: string;
        SET_SPLITS_PREVIOUS_RTA_TIME: string;
        SET_SPLITS_PREVIOUS_IGT_TIME: string;
        DISCARDING_SPLITS_RESET: string;
        SAVING_SPLITS_RESET: string;
        APPLY_SPLITS_FILE: string;

        SET_TIMER_START_DELAY: string;
        SET_TIMER_STATUS: string;
    };
    keybindings: {
        SPLITS_SPLIT: string;
        SPLITS_SKIP: string;
        SPLITS_UNDO: string;
        SPLITS_TOGGLE_PAUSE: string;
        SPLITS_RESET: string;
    };
    settings: {
        SPLITS_PIN_LAST_SEGMENT: string;
        SPLITS_VISIBLE_UPCOMING_SEGMENTS: string;
        SPLITS_VISIBLE_PREVIOUS_SEGMENTS: string;
        SPLITS_SEGMENT_TIME_FORMAT: string;
        SPLITS_COMPARISON_TIME_FORMAT: string;
        TIMER_FORMAT: string;
        APP_SHOW_TITLE_BAR: string;
    };
}
