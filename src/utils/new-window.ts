import { remote, BrowserWindowConstructorOptions } from 'electron';

const defSettings: BrowserWindowConstructorOptions = {
    webPreferences: {
        webSecurity: false
    },
    useContentSize: true,
    title: 'Splitterino',
    frame: false,
    titleBarStyle: 'hidden',
};

const url = 'http://localhost:8080#';

export function newWindow(
    settings: BrowserWindowConstructorOptions,
    route: string = ''
) {
    const win = new remote.BrowserWindow({
        ...defSettings,
        ...settings
    });

    if (!process.env.IS_TEST) {
        win.webContents.openDevTools({ mode: 'detach' });
    }

    win.loadURL(url + route);
    win.show();
}
