import { globalShortcut } from 'electron';
import { Injector } from 'lightweight-di';
import { v4 as uuid } from 'uuid';

import { FunctionRegistry } from '../../common/function-registry';
import { KeybindingTriggerBroadcast, MessageType } from '../../models/ipc';
import { IPC_SERVER_SERVICE_TOKEN, STORE_SERVICE_TOKEN } from '../../models/services';
import { RootState } from '../../models/states/root.state';
import { Logger } from '../../utils/logger';
import { BaseStore } from '../base-store';
import { HANDLER_SET_BINDINGS } from '../modules/keybindings.module';

export function registerKeybindingsListener(injector: Injector) {
    const store = injector.get(STORE_SERVICE_TOKEN) as BaseStore<RootState>;
    const ipcServer = injector.get(IPC_SERVER_SERVICE_TOKEN);

    store.onCommit(commit => {
        try {
            const commitType = [commit.namespace, commit.module, commit.handler].join('/');
            // Skip all mutations which aren't changing the bindings
            if (commit == null || commitType !== HANDLER_SET_BINDINGS) {
                return;
            }

            // Remove all previously set shortcuts
            globalShortcut.unregisterAll();
            const state = store.state.splitterino.keybindings;
            const bindings = state.bindings;

            if (!Array.isArray(bindings) || bindings.length < 1) {
                return;
            }

            bindings.forEach(theBinding => {
                globalShortcut.register(theBinding.accelerator, () => {
                    Logger.trace({
                        msg: 'Keybinding pressed',
                        binding: theBinding
                    });

                    // Call it fresh, otherwise the value isn't up to date from the getter
                    if (store.state.splitterino.keybindings.disableBindings) {
                        Logger.trace({
                            msg: 'Keybindings are disabled, ignoring action'
                        });

                        return;
                    }

                    // TODO: Check if global and if the window is focused

                    const actionFn = FunctionRegistry.getKeybindingAction(theBinding.action);

                    if (typeof actionFn === 'function') {
                        Logger.trace({
                            msg: 'Calling handler for action',
                            binding: theBinding
                        });
                        actionFn();

                        return;
                    }

                    if (ipcServer != null) {
                        const msg: KeybindingTriggerBroadcast = {
                            id: uuid(),
                            type: MessageType.BROADCAST_KEYBINDING_TRIGGER,
                            keybinding: theBinding.action,
                        };
                        ipcServer.publishMessage(msg);
                    }
                });
            });
        } catch (err) {
            Logger.error(err);

            return;
        }
    });
}
