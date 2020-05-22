/* eslint-disable no-unused-expressions,id-blacklist */
import { expect } from 'chai';

import { KeybindingsState } from '../../../src/models/states/keybindings.state';
import { Module } from '../../../src/store';
import { getKeybindingsStoreModule, ID_HANDLER_SET_BINDINGS, ID_HANDLER_DISABLE_BINDINGS } from '../../../src/store/modules/keybindings.module';
import { ActionKeybinding } from '../../../src/models/keybindings';
import { KEYBINDING_SPLITS_SPLIT, KEYBINDING_SPLITS_UNDO, KEYBINDING_SPLITS_TOGGLE_PAUSE, KEYBINDING_SPLITS_RESET } from '../../../src/common/constants';

describe('Keybindings Store-Module', () => {
    const keybindingsModule: Module<KeybindingsState> = getKeybindingsStoreModule();

    it('should be a valid module', () => {
        expect(keybindingsModule).to.be.a('object');
        expect(keybindingsModule).to.have.property('handlers').which.is.a('object').and.has.keys;
        expect(keybindingsModule).to.have.property('initialize').which.is.a('function');

        const state = keybindingsModule.initialize();
        expect(state).to.be.a('object').and.to.have.keys;
    });

    describe('Handlers', () => {
        describe(ID_HANDLER_SET_BINDINGS, () => {
            it('should set the bindings', () => {
                const state = keybindingsModule.initialize();
                const newBindings: ActionKeybinding[] = [
                    {
                        accelerator: 'CTRL+ALT+T',
                        action: KEYBINDING_SPLITS_SPLIT,
                        global: true,
                        keys: [
                            'CTRL',
                            'ALT',
                            'T',
                        ]
                    },
                    {
                        accelerator: 'CTRL+S',
                        action: KEYBINDING_SPLITS_UNDO,
                        global: false,
                        keys: [
                            'CTRL',
                            'S',
                        ]
                    },
                ];
                const diff = keybindingsModule.handlers[ID_HANDLER_SET_BINDINGS](state, newBindings);
                expect(diff).to.deep.equal({ bindings: newBindings });
            });

            it('should filter out invalid keybindings', () => {
                const state = keybindingsModule.initialize();
                const newBindings = [
                    {
                        accelerator: 'CTRL+ALT+T',
                        action: KEYBINDING_SPLITS_SPLIT,
                        global: true,
                    },
                    {
                        accelerator: 'CTRL+S',
                        action: KEYBINDING_SPLITS_UNDO,
                        global: false,
                        keys: [
                            'CTRL',
                            'S',
                        ]
                    },
                    {
                        accelerator: 'CTRL+P',
                        action: KEYBINDING_SPLITS_TOGGLE_PAUSE,
                        global: false,
                        keys: [
                            'CTRL',
                            'P',
                        ],
                    },
                    {
                        action: KEYBINDING_SPLITS_RESET,
                        global: true,
                        keys: [],
                    },
                ];
                const diff = keybindingsModule.handlers[ID_HANDLER_SET_BINDINGS](state, newBindings);
                expect(diff).to.deep.equal({
                    bindings: [
                        {
                            accelerator: 'CTRL+S',
                            action: KEYBINDING_SPLITS_UNDO,
                            global: false,
                            keys: [
                                'CTRL',
                                'S',
                            ]
                        },
                        {
                            accelerator: 'CTRL+P',
                            action: KEYBINDING_SPLITS_TOGGLE_PAUSE,
                            global: false,
                            keys: [
                                'CTRL',
                                'P',
                            ],
                        }
                    ]
                });
            });
        });

        describe(ID_HANDLER_DISABLE_BINDINGS, () => {
            it('should set the flag correctly', () => {
                const state = keybindingsModule.initialize();
                [
                    undefined,
                    null,
                    false,
                    0,
                    NaN,
                    '',
                ].forEach(value => {
                    const diff = keybindingsModule.handlers[ID_HANDLER_DISABLE_BINDINGS](state, value);
                    expect(diff.disableBindings).to.equal(false);
                });
                [
                    true,
                    1,
                    2,
                    -1,
                    Infinity,
                    -Infinity,
                    'hi',
                    [],
                    {},
                ].forEach(value => {
                    const diff = keybindingsModule.handlers[ID_HANDLER_DISABLE_BINDINGS](state, value);
                    expect(diff.disableBindings).to.equal(true);
                });
            });
        });
    });
});
