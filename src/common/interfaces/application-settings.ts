import { BrowserWindowConstructorOptions } from 'electron';
import { ActionKeybinding } from './keybindings';

export interface ApplicationSettings {
    windowOptions: BrowserWindowConstructorOptions;
    lastOpenedSplitsFiles?: string[];
    keybindings?: ActionKeybinding[];
}
