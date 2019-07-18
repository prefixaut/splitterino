import { ApplicationSettings } from './interfaces/application-settings';

export const applicationSettingsDefaults: ApplicationSettings = {
    windowOptions: {
        width: 800,
        height: 600,
        useContentSize: true,
        title: 'Splitterino',
        frame: false,
        titleBarStyle: 'hidden',
        maximizable: false,
        minWidth: 240,
        minHeight: 60,
        center: true,
        webPreferences: {
            nodeIntegration: true
        }
    }
};
