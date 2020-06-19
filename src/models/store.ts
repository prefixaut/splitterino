import {
    CONTEXT_MENU_MODULE_NAME,
    GAME_INFO_MODULE_NAME,
    KEYBINDINGS_MODULE_NAME,
    META_MODULE_NAME,
    PLUGINS_MODULE_NAME,
    PLUGINS_NAMESPACE_NAME,
    SETTINGS_MODULE_NAME,
    SPLITS_MODULE_NAME,
    SPLITTERINO_NAMESPACE_NAME,
    TIMER_MODULE_NAME,
} from '../common/constants';
import { ContextMenuState } from './states/context-menu.state';
import { GameInfoState } from './states/game-info.state';
import { KeybindingsState } from './states/keybindings.state';
import { MetaState } from './states/meta.state';
import { PluginsState } from './states/plugins.state';
import { SettingsState } from './states/settings.state';
import { SplitsState } from './states/splits.state';
import { TimerState } from './states/timer.state';

export interface StoreState {
    [namespace: string]: {
        [module: string]: any;
    };
}

export interface DiffHandlerTree {
    [namespace: string]: {
        [module: string]: {
            [handler: string]: DiffHandler<unknown>;
        };
    };
}

export interface Module<S> {
    initialize(): Required<S>;
    handlers: {
        [name: string]: DiffHandler<S>;
    };
}

export type DiffHandler<S> = (state: S, data?: any) => Partial<S>;
export type StoreListener<S> = (commit: Commit, state: S) => void;

export interface Commit {
    namespace: string;
    module: string;
    handler: string;
    data?: any;
}

export interface RootModules {
    [SPLITTERINO_NAMESPACE_NAME]: SplitterinoModules;
    [PLUGINS_NAMESPACE_NAME]: {
        [name: string]: Module<unknown>;
    };
}

export interface SplitterinoModules {
    [CONTEXT_MENU_MODULE_NAME]: Module<ContextMenuState>;
    [GAME_INFO_MODULE_NAME]: Module<GameInfoState>;
    [KEYBINDINGS_MODULE_NAME]: Module<KeybindingsState>;
    [META_MODULE_NAME]: Module<MetaState>;
    [PLUGINS_MODULE_NAME]: Module<PluginsState>;
    [SETTINGS_MODULE_NAME]: Module<SettingsState>;
    [SPLITS_MODULE_NAME]: Module<SplitsState>;
    [TIMER_MODULE_NAME]: Module<TimerState>;
}

export interface RootState extends StoreState {
    [SPLITTERINO_NAMESPACE_NAME]: SplitterinoState;
    [PLUGINS_NAMESPACE_NAME]: {
        [name: string]: any;
    };
}

export interface SplitterinoState {
    [CONTEXT_MENU_MODULE_NAME]: ContextMenuState;
    [GAME_INFO_MODULE_NAME]: GameInfoState;
    [KEYBINDINGS_MODULE_NAME]: KeybindingsState;
    [META_MODULE_NAME]: MetaState;
    [PLUGINS_MODULE_NAME]: PluginsState;
    [SETTINGS_MODULE_NAME]: SettingsState;
    [SPLITS_MODULE_NAME]: SplitsState;
    [TIMER_MODULE_NAME]: TimerState;
}
