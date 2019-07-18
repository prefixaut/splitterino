import { BrowserWindowConstructorOptions } from 'electron';
import { ActionKeybinding } from './keybindings';
import { RecentlyOpenedSplit } from '../../store/states/meta.state';

export interface ApplicationSettings {
    windowOptions: BrowserWindowConstructorOptions;
    lastOpenedSplitsFiles?: RecentlyOpenedSplit[];
    keybindings?: ActionKeybinding[];
}
