import { globalShortcut } from 'electron';
import { Injector } from 'lightweight-di';
import { filter, map } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { HANDLER_SET_KEYBINDINGS_BINDINGS } from '../../common/constants';
import { FunctionRegistry } from '../../common/function-registry';
import { KeybindingTriggerBroadcast, MessageType } from '../../models/ipc';
import { IPC_SERVER_SERVICE_TOKEN, STORE_SERVICE_TOKEN } from '../../models/services';
import { RootState } from '../../models/store';
import { Logger } from '../../utils/logger';
import { BaseStore } from '../base-store';

export function registerKeybindingsListener(injector: Injector) {
    const store = injector.get(STORE_SERVICE_TOKEN) as BaseStore<RootState>;
    const ipcServer = injector.get(IPC_SERVER_SERVICE_TOKEN);

    function actionHandler(action: string) {
        // Call it fresh, otherwise the value isn't up to date from the getter
        if (store.state.splitterino.keybindings.disableBindings) {
            Logger.trace({
                msg: 'Keybindings are disabled, ignoring action'
            });

            return;
        }

        const actionFn = FunctionRegistry.getKeybindingAction(action);

        if (typeof actionFn === 'function') {
            Logger.trace({
                msg: 'Calling handler for action',
                action,
            });
            actionFn();

            return;
        }

        if (ipcServer != null) {
            const msg: KeybindingTriggerBroadcast = {
                id: uuid(),
                type: MessageType.BROADCAST_KEYBINDING_TRIGGER,
                keybinding: action,
            };
            ipcServer.publishMessage(msg);
        }
    }

    store.onCommit(commit => {
        try {
            const commitType = [commit.namespace, commit.module, commit.handler].join('/');
            // Skip all mutations which aren't changing the bindings
            if (commit == null || commitType !== HANDLER_SET_KEYBINDINGS_BINDINGS) {
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

                    // TODO: Check if global and if the window is focused

                    actionHandler(theBinding.action);
                });
            });
        } catch (err) {
            Logger.error(err);

            return;
        }
    });

    ipcServer.listenToRouterSocket()
        .pipe(
            map(packet => packet.message),
            filter(msg => msg.type === MessageType.REQUEST_TRIGGER_KEYBINDING)
        )
        .subscribe(msg => {
            const state = store.state.splitterino.keybindings;

            if (!Array.isArray(state.actions) || state.actions.length < 1) {
                return;
            }

            const action = state.actions.find(anAction => anAction.id === msg.id);

            if (action == null) {
                return;
            }

            actionHandler(action.id);
        });
}
