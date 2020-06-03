/* eslint-disable no-unused-expressions */
import { expect } from 'chai';

import {
    CTX_MENU_SPLITS_EDIT,
    CTX_MENU_SPLITS_LOAD_FROM_FILE,
    CTX_MENU_SPLITS_SAVE_TO_FILE,
    CTX_MENU_TEMPLATES_LOAD_FROM_FILE,
    CTX_MENU_WINDOW_CLOSE,
    CTX_MENU_WINDOW_RELOAD,
} from '../../../src/common/constants';
import { ContextMenuState } from '../../../src/models/states/context-menu.state';
import { Module } from '../../../src/models/store';
import { contextMenuGetter, getContextMenuStoreModule } from '../../../src/store/modules/context-menu.module';

describe('Context-Menu Store-Module', () => {
    const contextMenuModule: Module<ContextMenuState> = getContextMenuStoreModule();

    it('should be a valid module', () => {
        expect(contextMenuModule).to.be.a('object');
        expect(contextMenuModule).to.have.property('handlers').which.is.a('object').and.has.keys;
        expect(contextMenuModule).to.have.property('initialize').which.is.a('function');

        const state = contextMenuModule.initialize();
        expect(state).to.be.a('object').and.to.have.keys;
    });

    describe('Getters', () => {
        describe('contextMenuGetter', () => {
            it('should get the menus', () => {

                const state = contextMenuModule.initialize();
                const getter = contextMenuGetter(state);

                expect(getter(['def', 'splitter', 'templates'])).to.deep.equal([
                    {
                        label: 'Reload',
                        actions: [CTX_MENU_WINDOW_RELOAD],
                        type: 'normal',
                    },
                    {
                        label: 'Exit',
                        actions: [CTX_MENU_WINDOW_CLOSE],
                        type: 'normal',
                    },
                    { type: 'separator' },
                    {
                        label: 'Edit Splits ...',
                        actions: [CTX_MENU_SPLITS_EDIT],
                        type: 'normal',
                    },
                    {
                        label: 'Load Splits ...',
                        actions: [CTX_MENU_SPLITS_LOAD_FROM_FILE],
                        type: 'normal',
                    },
                    {
                        label: 'Save Splits ...',
                        actions: [CTX_MENU_SPLITS_SAVE_TO_FILE],
                        type: 'normal',
                    },
                    { type: 'separator' },
                    {
                        label: 'Load Templates ...',
                        actions: [CTX_MENU_TEMPLATES_LOAD_FROM_FILE],
                        type: 'normal',
                    },
                ]);
            });
        });
    });
});
