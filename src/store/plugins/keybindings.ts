import { globalShortcut } from 'electron';

import { BaseStore } from '..';
import { FunctionRegistry } from '../../common/function-registry';
import { RootState } from '../../models/states/root.state';
import { Logger } from '../../utils/logger';
import { HANDLER_SET_BINDINGS } from '../modules/keybindings.module';

export function registerKeybindingsListener(store: BaseStore<RootState>) {
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
                    // TODO: Check if global and if the window is focused

                    const actionFn = FunctionRegistry.getKeybindingAction(theBinding.action);
                    if (typeof actionFn !== 'function') {
                        Logger.debug({
                            msg: 'No handler found for action',
                            binding: theBinding
                        });

                        return;
                    }

                    // Call it fresh, otherwise the value isn't up to date from the getter
                    if (store.state.splitterino.keybindings.disableBindings) {
                        Logger.trace({
                            msg: 'Keybindings are disabled, ignoring action'
                        });

                        return;
                    }

                    Logger.trace({
                        msg: 'Calling handler for action',
                        binding: theBinding
                    });
                    actionFn();
                });
            });
        } catch (err) {
            Logger.error(err);

            return;
        }
    });
}
