import { BrowserWindowConstructorOptions } from 'electron';
import { ActionKeybinding } from './keybindings';

export interface ApplicationSettings {
    windowOptions: BrowserWindowConstructorOptions;
    lastOpenedSplitsFile?: string;
    keybindings?: ActionKeybinding[];
}
