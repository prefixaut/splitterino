import { BrowserWindowConstructorOptions } from 'electron';

import { ActionKeybinding } from './keybindings';
import { RecentlyOpenedSplit, RecentlyOpenedTemplate } from './states/meta.state';

export interface ApplicationSettings {
    windowOptions: BrowserWindowConstructorOptions;
    lastOpenedSplitsFiles?: RecentlyOpenedSplit[];
    lastOpenedTemplateFiles?: RecentlyOpenedTemplate[];
    keybindings?: ActionKeybinding[];
}
