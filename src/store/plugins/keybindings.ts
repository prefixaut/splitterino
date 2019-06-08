import { globalShortcut } from 'electron';
import { Store } from 'vuex';

import { FunctionRegistry } from '../../common/function-registry';
import { MUTATION_SET_BINDINGS } from '../modules/keybindings.module';
import { RootState } from '../states/root.state';

export function getKeybindingsStorePlugin() {
    return (store: Store<RootState>) => {
        store.subscribe(mutation => {
            // Skip all mutations which aren't changing the bindings
            if (mutation == null || mutation.type !== MUTATION_SET_BINDINGS) {
                return;
            }

            // Remove all previously set shortcuts
            globalShortcut.unregisterAll();
            const state = store.state.splitterino.keybindings;
            const bindings = state.bindings;

            bindings.forEach(theBinding => {
                globalShortcut.register(theBinding.accelerator, () => {
                    // TODO: Check if global and if the window is focused

                    const actionFn = FunctionRegistry.getKeybindingAction(theBinding.action);
                    if (typeof actionFn === 'function' && !state.disableBindings) {
                        actionFn({
                            store: store,
                        });
                    }
                });
            });
        });
    };
}
