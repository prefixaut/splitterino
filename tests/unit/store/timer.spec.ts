import { expect } from 'chai';
import Vue from 'vue';
import Vuex, { Module } from 'vuex';

import { getTimerStoreModule } from '../../../src/store/modules/timer.module';
import { RootState } from '../../../src/store/states/root.state';
import { TimerState } from '../../../src/store/states/timer.state';

Vue.use(Vuex);

describe('Timer Store-Module', () => {
    const timerModule: Module<TimerState, RootState> = getTimerStoreModule();

    it('should be a valid module', () => {
        expect(timerModule).to.be.a('object');
        // tslint:disable-next-line no-unused-expression
        expect(timerModule).to.have.property('state').and.to.be.a('object').which.has.keys;
        // tslint:disable-next-line no-unused-expression
        expect(timerModule).to.have.property('mutations').and.to.be.a('object').which.has.keys;
    });
});
