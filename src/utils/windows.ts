import { Store } from 'vuex';

import { ElectronInterface } from '../models/electron';
import { TimerStatus } from '../common/timer-status';
import { ACTION_SPLIT } from '../store/modules/splits.module';
import { RootState } from '../store/states/root.state';
import { IOService } from '../services/io.service';

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

export function openLoadSplits(electron: ElectronInterface, io: IOService, store: Store<RootState>) {
    if (store.state.splitterino.meta.lastOpenedSplitsFiles.length === 0) {
        io.loadSplitsFromFileToStore(store);
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

export function openLoadTemplate(electron: ElectronInterface, io: IOService, store: Store<RootState>) {
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

export async function openSplitsEditor(electron: ElectronInterface, store: Store<RootState>) {
    const state = store.state;
    const status = state.splitterino.timer.status;

    if (status === TimerStatus.FINISHED) {
        // Finish the run when attempting to edit the splits
        await store.dispatch(ACTION_SPLIT);
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
