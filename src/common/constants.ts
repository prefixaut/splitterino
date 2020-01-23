import { SettingsConfigurationNamespace } from '../store/states/settings.state';

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

/*
 * Context Menu
 */
export const CTX_MENU_WINDOW_RELOAD = 'core.window.reload';
export const CTX_MENU_WINDOW_CLOSE = 'core.window.close';

export const CTX_MENU_SPLITS_EDIT = 'core.splits.edit';
export const CTX_MENU_SPLITS_LOAD_FROM_FILE = 'core.splits.load-from-file';
export const CTX_MENU_SPLITS_SAVE_TO_FILE = 'core.splits.save-to-file';

export const CTX_MENU_SETTINGS_OPEN = 'core.settings.open';

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
 * Settings
 */
export const CORE_SETTINGS: SettingsConfigurationNamespace = {
    key: 'core',
    label: 'Core',
    groups: [
        {
            key: 'splits',
            label: 'Splits',
            settings: [
                {
                    key: 'pinLastSegment',
                    label: 'Pin the last Segment',
                    component: 'spl-checkbox',
                    componentProps: {},
                    defaultValue: false,
                },
                {
                    key: 'visibleUpcomingSegments',
                    label: 'Visible upcoming Segments',
                    component: 'spl-number-input',
                    componentProps: {},
                    defaultValue: 2,
                },
                {
                    key: 'visiblePreviousSegments',
                    label: 'Visible previous Segments',
                    component: 'spl-number-input',
                    componentProps: {},
                    defaultValue: 1,
                },
                {
                    key: 'formatSegmentTime',
                    label: 'Segment Time Format',
                    component: 'spl-aevum-format-input',
                    componentProps: {},
                    defaultValue: DEFAULT_TIMER_FORMAT,
                },
                {
                    key: 'formatComparisonTime',
                    label: 'Segment Comparison Format',
                    component: 'spl-aevum-format-input',
                    componentProps: {},
                    defaultValue: DEFAULT_TIMER_FORMAT,
                },
            ]
        },
        {
            key: 'timer',
            label: 'Timer',
            settings: [
                {
                    key: 'format',
                    label: 'Format',
                    component: 'spl-aevum-format-input',
                    componentProps: {},
                    defaultValue: DEFAULT_TIMER_FORMAT,
                },
            ]
        },
        {
            key: 'app',
            label: 'Application',
            settings: [
                {
                    key: 'showTitleBar',
                    label: 'Show Title Bar',
                    component: 'spl-checkbox',
                    componentProps: {},
                    defaultValue: true,
                },
            ]
        },
    ]
};
