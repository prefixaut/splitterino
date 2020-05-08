import { Injector } from 'lightweight-di';

import { TimerStatus } from '../common/timer-status';
import { ELECTRON_SERVICE_TOKEN, ElectronInterface } from '../models/electron';
import { ACTION_SERVICE_TOKEN } from '../services/action.service';
import { IO_SERVICE_TOKEN } from '../services/io.service';
import { STORE_SERVICE_TOKEN } from '../store';

export function openKeybindgsEditor(electron: ElectronInterface) {
    electron.newWindow(
        {
            title: 'Keybindings',
            parent: electron.getCurrentWindow(),
            width: 650,
            height: 310,
            modal: true,
            minimizable: false
        },
        '/keybindings'
    );
}

export function openSettingsEditor(electron: ElectronInterface) {
    electron.newWindow(
        {
            title: 'Settings',
            parent: electron.getCurrentWindow(),
            width: 650,
            height: 310,
            modal: true,
            minimizable: false
        },
        '/settings'
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

export function openSplitsBrowser(electron: ElectronInterface) {
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
        '/open-splits'
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

export function openTemplateBrowser(electron: ElectronInterface) {
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
        '/open-template'
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
        '/splits-editor'
    );
}
