import { expect } from 'chai';
import Vue from 'vue';
import Vuex, { Module } from 'vuex';

import { getContextMenuStoreModule } from '../../../src/store/modules/context-menu.module';
import { ContextMenuState } from '../../../src/store/states/context-menu.state';
import { RootState } from '../../../src/store/states/root.state';

Vue.use(Vuex);

describe('Context-Menu Store-Module', () => {
    const contextMenuModule: Module<ContextMenuState, RootState> = getContextMenuStoreModule();

    it('should be a valid module', () => {
        expect(contextMenuModule).to.be.a('object');
        // tslint:disable-next-line no-unused-expression
        expect(contextMenuModule).to.have.property('state').and.to.be.a('object').which.has.keys;
        // tslint:disable-next-line no-unused-expression
        expect(contextMenuModule).to.have.property('mutations').and.to.be.a('object').which.has.keys;
        // tslint:disable-next-line no-unused-expression
        expect(contextMenuModule).to.have.property('actions').and.to.be.a('object').which.has.keys;
    });
});
