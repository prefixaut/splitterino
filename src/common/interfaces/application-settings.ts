import { BrowserWindowConstructorOptions } from 'electron';
import { ActionKeybinding } from './keybindings';

export interface ApplicationSettings {
    window: BrowserWindowConstructorOptions;
    lastOpenedSplitsFile?: string;
    keybindings?: ActionKeybinding[];
}
