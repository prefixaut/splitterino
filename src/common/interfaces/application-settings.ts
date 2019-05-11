import { BrowserWindowConstructorOptions } from 'electron';

export interface ApplicationSettings {
    window: BrowserWindowConstructorOptions;
    lastOpenedSplitsFile?: string;
}
