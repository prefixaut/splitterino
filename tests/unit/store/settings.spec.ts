import { expect } from 'chai';
import Vue from 'vue';
import Vuex, { Module } from 'vuex';

import { getSettingsStoreModule } from '../../../src/store/modules/settings.module';
import { RootState } from '../../../src/store/states/root.state';
import { SettingsState } from '../../../src/store/states/settings.state';
import { createMockInjector } from '../../utils';

const injector = createMockInjector();

Vue.use(Vuex);

describe('Settings Store-Module', () => {
    const settingsModule: Module<SettingsState, RootState> = getSettingsStoreModule();

    it('should be a valid module', () => {
        expect(settingsModule).to.be.a('object');
        // tslint:disable-next-line no-unused-expression
        expect(settingsModule).to.have.property('state').and.to.be.a('object').which.has.keys;
        // tslint:disable-next-line no-unused-expression
        expect(settingsModule).to.have.property('mutations').and.to.be.a('object').which.has.keys;
        // tslint:disable-next-line no-unused-expression
        expect(settingsModule).to.have.property('actions').and.to.be.a('object').which.has.keys;
    });
});
