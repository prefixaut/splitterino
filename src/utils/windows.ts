import { Injector } from 'lightweight-di';

import {
    ACTION_SERVICE_TOKEN,
    ELECTRON_SERVICE_TOKEN,
    IO_SERVICE_TOKEN,
    KEYBINDINGS_ROUTE,
    OPEN_SPLITS_ROUTE,
    OPEN_TEMPLATE_ROUTE,
    PLUGIN_MANAGER_ROUTE,
    SETTINGS_ROUTE,
    SPLITS_EDITOR_ROUTE,
    STORE_SERVICE_TOKEN,
} from '../common/constants';
import { TimerStatus } from '../common/timer-status';
import { ElectronServiceInterface } from '../models/services';

export function openKeybindgsEditor(electron: ElectronServiceInterface) {
    electron.newWindow(
        {
            title: 'Keybindings',
            parent: electron.getCurrentWindow(),
            width: 650,
            height: 310,
            modal: true,
            minimizable: false
        },
        KEYBINDINGS_ROUTE
    );
}

export function openSettingsEditor(electron: ElectronServiceInterface) {
    electron.newWindow(
        {
            title: 'Settings',
            parent: electron.getCurrentWindow(),
            width: 650,
            height: 310,
            modal: true,
            minimizable: false
        },
        SETTINGS_ROUTE
    );
}

export function openPluginManager(electron: ElectronServiceInterface) {
    electron.newWindow(
        {
            title: 'Plugin Manager',
            parent: electron.getCurrentWindow(),
            width: 650,
            height: 310,
            modal: true,
            minimizable: false
        },
        PLUGIN_MANAGER_ROUTE
    );
}

export function openLoadSplits(injector: Injector) {
    const electron = injector.get(ELECTRON_SERVICE_TOKEN);
    const io = injector.get(IO_SERVICE_TOKEN);
    const store = injector.get(STORE_SERVICE_TOKEN);

    if (store.state.splitterino.meta.lastOpenedSplitsFiles.length === 0) {
        io.loadSplitsFromFileToStore();
    } else {
        openSplitsBrowser(electron);
    }
}

export function openSplitsBrowser(electron: ElectronServiceInterface) {
    electron.newWindow(
        {
            title: 'Open Splits File',
            parent: electron.getCurrentWindow(),
            resizable: false,
            width: 440,
            height: 250,
            modal: true,
            minimizable: false
        },
        OPEN_SPLITS_ROUTE
    );
}

export function openLoadTemplate(injector: Injector) {
    const electron = injector.get(ELECTRON_SERVICE_TOKEN);
    const io = injector.get(IO_SERVICE_TOKEN);
    const store = injector.get(STORE_SERVICE_TOKEN);

    if (store.state.splitterino.meta.lastOpenedTemplateFiles.length === 0) {
        io.askUserToOpenTemplateFile();
    } else {
        openTemplateBrowser(electron);
    }
}

export function openTemplateBrowser(electron: ElectronServiceInterface) {
    electron.newWindow(
        {
            title: 'Open Template File',
            parent: electron.getCurrentWindow(),
            resizable: false,
            width: 440,
            height: 250,
            modal: true,
            minimizable: false
        },
        OPEN_TEMPLATE_ROUTE
    );
}

export async function openSplitsEditor(injector: Injector) {
    const electron = injector.get(ELECTRON_SERVICE_TOKEN);
    const store = injector.get(STORE_SERVICE_TOKEN);
    const actions = injector.get(ACTION_SERVICE_TOKEN);

    const status = store.state.splitterino.timer.status;

    if (status === TimerStatus.FINISHED) {
        // Finish the run when attempting to edit the splits
        await actions.splitTimer();
    } else if (status !== TimerStatus.STOPPED) {
        electron.showMessageDialog(electron.getCurrentWindow(), {
            title: 'Editing not allowed',
            message: 'You can not edit the Splits while there is a run going!',
            type: 'error',
        });

        return;
    }

    electron.newWindow(
        {
            title: 'Splits Editor',
            parent: electron.getCurrentWindow(),
            modal: true,
            minimizable: false
        },
        SPLITS_EDITOR_ROUTE
    );
}
