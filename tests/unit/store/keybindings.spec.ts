import { expect } from 'chai';
import Vue from 'vue';
import Vuex, { Module } from 'vuex';

import { keybindingsStoreModule } from '../../../src/store/modules/keybindings.module';
import { KeybindingsState } from '../../../src/store/states/keybindings.state';
import { RootState } from '../../../src/store/states/root.state';

Vue.use(Vuex);

describe('Keybindings Store-Module', () => {
    const keybindingsModule: Module<KeybindingsState, RootState> = keybindingsStoreModule;

    it('should be a valid module', () => {
        expect(keybindingsModule).to.be.a('object');
        // tslint:disable-next-line no-unused-expression
        expect(keybindingsModule).to.have.property('state').and.to.be.a('object').which.has.keys;
        // tslint:disable-next-line no-unused-expression
        expect(keybindingsModule).to.have.property('mutations').and.to.be.a('object').which.has.keys;
        // tslint:disable-next-line no-unused-expression
        expect(keybindingsModule).to.have.property('actions').and.to.be.a('object').which.has.keys;
    });
});
