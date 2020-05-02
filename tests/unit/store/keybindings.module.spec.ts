/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import Vue from 'vue';
import Vuex, { Module } from 'vuex';

import { KeybindingsState } from '../../../src/models/states/keybindings.state';
import { RootState } from '../../../src/models/states/root.state';
import { getKeybindingsStoreModule } from '../../../src/store/modules/keybindings.module';

Vue.use(Vuex);

describe('Keybindings Store-Module', () => {
    const keybindingsModule: Module<KeybindingsState, RootState> = getKeybindingsStoreModule();

    it('should be a valid module', () => {
        expect(keybindingsModule).to.be.a('object');
        expect(keybindingsModule).to.have.property('state').and.to.be.a('object').which.has.keys;
        expect(keybindingsModule).to.have.property('mutations').and.to.be.a('object').which.has.keys;
        expect(keybindingsModule).to.have.property('actions').and.to.be.a('object').which.has.keys;
    });
});
