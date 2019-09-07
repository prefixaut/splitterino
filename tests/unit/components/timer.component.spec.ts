import { createLocalVue, mount } from '@vue/test-utils';
import { expect } from 'chai';
import Vuex, { Store } from 'vuex';

import { TimerStatus } from '../../../src/common/timer-status';
import TimerComponent from '../../../src/components/timer.vue';
import { aevumFilter } from '../../../src/filters/aevum.filter';
import { getSplitterinoStoreModules } from '../../../src/store/modules/index.module';
import { RootState } from '../../../src/store/states/root.state';
import { TimerState } from '../../../src/store/states/timer.state';
import { now } from '../../../src/utils/time';
import { createMockInjector, wait } from '../../utils';
import { Aevum } from 'aevum';
import { DEFAULT_TIMER_FORMAT } from '../../../src/common/constants';
import { MUTATION_SET_STATUS } from '../../../src/store/modules/timer.module';

function setupVueInstance() {
    const localVue = createLocalVue();

    localVue.filter('aevum', aevumFilter);

    return localVue;
}

const maxTimeDeviation = 20;

describe('Timer.vue', () => {
    it('should be stopped on default', () => {
        const store = new Store<RootState>({
            modules: {
                splitterino: {
                    namespaced: true,
                    modules: getSplitterinoStoreModules(createMockInjector()),
                }
            }
        });

        const component = mount(TimerComponent, {
            localVue: setupVueInstance(),
            mocks: { $store: store },
        });

        expect(component.find('.content').text()).to.equal('0.000');
    });

    it('should render with custom format', () => {
        const store = new Store<RootState>({
            modules: {
                splitterino: {
                    namespaced: true,
                    modules: getSplitterinoStoreModules(createMockInjector()),
                }
            }
        });

        const component = mount(TimerComponent, {
            localVue: setupVueInstance(),
            mocks: { $store: store },
            propsData: { format: 'test[s]s[ddd]dtest' },
        });

        expect(component.find('.content').text()).to.equal('test0s000dtest');
    });

    it('should render the proper running rta time', async () => {
        const time = now();
        const offset = 2_000;
        const waitTime = 150;

        const modules = getSplitterinoStoreModules(createMockInjector());
        modules.timer.state = {
            ...modules.timer.state as TimerState,
            status: TimerStatus.RUNNING,
            startTime: time - offset,
        };

        const store = new Store<RootState>({
            modules: {
                splitterino: {
                    namespaced: true,
                    modules,
                }
            }
        });

        const component = mount(TimerComponent, {
            localVue: setupVueInstance(),
            mocks: { $store: store },
        });

        expect(component.vm.$data.currentTime).to.be.within(offset, offset + maxTimeDeviation);
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = 0; i <= maxTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(waitTime);

        expect(component.vm.$data.currentTime).to.be.within(offset + waitTime, offset + waitTime + maxTimeDeviation);
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = 0; i <= maxTimeDeviation; i++) {
            secondValidTimes.push(formatter.format(offset + waitTime + i));
        }
        expect(secondText).to.be.oneOf(secondValidTimes);
    });

    it('should render the proper running rta time with pauses', async () => {
        const time = now();
        const offset = 2_000;
        const waitTime = 150;
        const pauseTime = 500;

        const modules = getSplitterinoStoreModules(createMockInjector());
        modules.timer.state = {
            ...modules.timer.state as TimerState,
            status: TimerStatus.RUNNING,
            startTime: time - offset,
            pauseTotal: pauseTime,
        };

        const store = new Store<RootState>({
            modules: {
                splitterino: {
                    namespaced: true,
                    modules,
                }
            }
        });

        const component = mount(TimerComponent, {
            localVue: setupVueInstance(),
            mocks: { $store: store },
        });

        expect(component.vm.$data.currentTime)
            .to.be.within(offset - pauseTime, (offset - pauseTime) + maxTimeDeviation);
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = 0; i <= maxTimeDeviation; i++) {
            validTimes.push(formatter.format((offset - pauseTime) + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(waitTime);

        expect(component.vm.$data.currentTime)
            .to.be.within((offset - pauseTime) + waitTime, (offset - pauseTime) + waitTime + maxTimeDeviation);
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = 0; i <= maxTimeDeviation; i++) {
            secondValidTimes.push(formatter.format((offset - pauseTime) + waitTime + i));
        }
        expect(secondText).to.be.oneOf(secondValidTimes);
    });

    it('should render the proper running rta time with igt pauses', async () => {
        const time = now();
        const offset = 2_000;
        const waitTime = 150;

        const modules = getSplitterinoStoreModules(createMockInjector());
        modules.timer.state = {
            ...modules.timer.state as TimerState,
            status: TimerStatus.RUNNING,
            startTime: time - offset,
            igtPauseTotal: 500,
        };

        const store = new Store<RootState>({
            modules: {
                splitterino: {
                    namespaced: true,
                    modules,
                }
            }
        });

        const component = mount(TimerComponent, {
            localVue: setupVueInstance(),
            mocks: { $store: store },
        });

        expect(component.vm.$data.currentTime)
            .to.be.within(offset, offset + maxTimeDeviation);
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = 0; i <= maxTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(waitTime);

        expect(component.vm.$data.currentTime)
            .to.be.within(offset + waitTime, offset + waitTime + maxTimeDeviation);
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = 0; i <= maxTimeDeviation; i++) {
            secondValidTimes.push(formatter.format(offset + waitTime + i));
        }
        expect(secondText).to.be.oneOf(secondValidTimes);
    });

    it('should render the proper running igt time', async () => {
        const time = now();
        const offset = 2_000;
        const waitTime = 150;

        const modules = getSplitterinoStoreModules(createMockInjector());
        modules.timer.state = {
            ...modules.timer.state as TimerState,
            status: TimerStatus.RUNNING,
            startTime: time - offset,
        };

        const store = new Store<RootState>({
            modules: {
                splitterino: {
                    namespaced: true,
                    modules,
                }
            }
        });

        const component = mount(TimerComponent, {
            localVue: setupVueInstance(),
            mocks: { $store: store },
            propsData: { igt: true },
        });

        expect(component.vm.$data.currentTime).to.be.within(offset, offset + maxTimeDeviation);
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = 0; i <= maxTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(waitTime);

        expect(component.vm.$data.currentTime).to.be.within(offset + waitTime, offset + waitTime + maxTimeDeviation);
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = 0; i <= maxTimeDeviation; i++) {
            secondValidTimes.push(formatter.format(offset + waitTime + i));
        }
        expect(secondText).to.be.oneOf(secondValidTimes);
    });

    it('should render the proper running igt time with pauses', async () => {
        const time = now();
        const offset = 2_000;
        const waitTime = 150;
        const pauseTime = 500;

        const modules = getSplitterinoStoreModules(createMockInjector());
        modules.timer.state = {
            ...modules.timer.state as TimerState,
            status: TimerStatus.RUNNING,
            startTime: time - offset,
            igtPauseTotal: pauseTime,
        };

        const store = new Store<RootState>({
            modules: {
                splitterino: {
                    namespaced: true,
                    modules,
                }
            }
        });

        const component = mount(TimerComponent, {
            localVue: setupVueInstance(),
            mocks: { $store: store },
            propsData: { igt: true },
        });

        expect(component.vm.$data.currentTime)
            .to.be.within(offset - pauseTime, (offset - pauseTime) + maxTimeDeviation);
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = 0; i <= maxTimeDeviation; i++) {
            validTimes.push(formatter.format((offset - pauseTime) + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(waitTime);

        expect(component.vm.$data.currentTime)
            .to.be.within((offset - pauseTime) + waitTime, (offset - pauseTime) + waitTime + maxTimeDeviation);
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = 0; i <= maxTimeDeviation; i++) {
            secondValidTimes.push(formatter.format((offset - pauseTime) + waitTime + i));
        }
        expect(secondText).to.be.oneOf(secondValidTimes);
    });

    it('should render the proper running igt time with rta pauses', async () => {
        const time = now();
        const offset = 2_000;
        const waitTime = 150;

        const modules = getSplitterinoStoreModules(createMockInjector());
        modules.timer.state = {
            ...modules.timer.state as TimerState,
            status: TimerStatus.RUNNING,
            startTime: time - offset,
            pauseTotal: 500,
        };

        const store = new Store<RootState>({
            modules: {
                splitterino: {
                    namespaced: true,
                    modules,
                }
            }
        });

        const component = mount(TimerComponent, {
            localVue: setupVueInstance(),
            mocks: { $store: store },
            propsData: { igt: true },
        });

        expect(component.vm.$data.currentTime)
            .to.be.within(offset, offset + maxTimeDeviation);
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = 0; i <= maxTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(waitTime);

        expect(component.vm.$data.currentTime)
            .to.be.within(offset + waitTime, offset + waitTime + maxTimeDeviation);
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = 0; i <= maxTimeDeviation; i++) {
            secondValidTimes.push(formatter.format(offset + waitTime + i));
        }
        expect(secondText).to.be.oneOf(secondValidTimes);
    });

    it('should stop updating when the rta timer changes to paused', async () => {
        const time = now();
        const offset = 2_000;
        const firstWaitTime = 50;
        const secondWaitTime = 50;

        const modules = getSplitterinoStoreModules(createMockInjector());
        modules.timer.state = {
            ...modules.timer.state as TimerState,
            status: TimerStatus.RUNNING,
            startTime: time - offset,
        };

        const store = new Store<RootState>({
            modules: {
                splitterino: {
                    namespaced: true,
                    modules,
                }
            }
        });

        const component = mount(TimerComponent, {
            localVue: setupVueInstance(),
            mocks: { $store: store },
        });

        expect(component.vm.$data.currentTime)
            .to.be.within(offset, offset + maxTimeDeviation);
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = 0; i <= maxTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(firstWaitTime);

        // Pausing the timer
        store.commit(MUTATION_SET_STATUS, TimerStatus.PAUSED);

        await wait(secondWaitTime);

        expect(component.vm.$data.currentTime)
            .to.be.within(offset + firstWaitTime, offset + firstWaitTime + maxTimeDeviation);
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = 0; i <= maxTimeDeviation; i++) {
            secondValidTimes.push(formatter.format(offset + firstWaitTime + i));
        }
        expect(secondText).to.be.oneOf(secondValidTimes);
    });

    it('should continue updating when the rta timer changes to running-igt-paused', async () => {
        const time = now();
        const offset = 2_000;
        const firstWaitTime = 50;
        const secondWaitTime = 50;
        const totalWaitTime = firstWaitTime + secondWaitTime;

        const modules = getSplitterinoStoreModules(createMockInjector());
        modules.timer.state = {
            ...modules.timer.state as TimerState,
            status: TimerStatus.RUNNING,
            startTime: time - offset,
        };

        const store = new Store<RootState>({
            modules: {
                splitterino: {
                    namespaced: true,
                    modules,
                }
            }
        });

        const component = mount(TimerComponent, {
            localVue: setupVueInstance(),
            mocks: { $store: store },
        });

        expect(component.vm.$data.currentTime)
            .to.be.within(offset, offset + maxTimeDeviation);
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = 0; i <= maxTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(firstWaitTime);

        // Pausing the timer
        store.commit(MUTATION_SET_STATUS, TimerStatus.RUNNING);

        await wait(secondWaitTime);

        expect(component.vm.$data.currentTime)
            .to.be.within(offset + totalWaitTime, offset + totalWaitTime + maxTimeDeviation);
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = 0; i <= maxTimeDeviation; i++) {
            secondValidTimes.push(formatter.format(offset + totalWaitTime + i));
        }
        expect(secondText).to.be.oneOf(secondValidTimes);
    });

    it('should start updating the rta timer when it changes to running', async () => {
        const time = now();
        const offset = 2_000;
        const firstWaitTime = 50;
        const secondWaitTime = 50;

        const modules = getSplitterinoStoreModules(createMockInjector());
        modules.timer.state = {
            ...modules.timer.state as TimerState,
            status: TimerStatus.PAUSED,
            startTime: time - offset,
            pauseTime: time,
        };

        const store = new Store<RootState>({
            modules: {
                splitterino: {
                    namespaced: true,
                    modules,
                }
            }
        });

        const component = mount(TimerComponent, {
            localVue: setupVueInstance(),
            mocks: { $store: store },
        });

        expect(component.vm.$data.currentTime)
            .to.be.within(offset, offset + maxTimeDeviation);
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = 0; i <= maxTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(firstWaitTime);

        // Pausing the timer
        store.commit(MUTATION_SET_STATUS, TimerStatus.RUNNING);

        await wait(secondWaitTime);

        expect(component.vm.$data.currentTime)
            .to.be.within(offset + secondWaitTime, offset + secondWaitTime + maxTimeDeviation);
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = 0; i <= maxTimeDeviation; i++) {
            secondValidTimes.push(formatter.format(offset + secondWaitTime + i));
        }
        expect(secondText).to.be.oneOf(secondValidTimes);
    });

    it('should start updating the rta timer when it changes to running-igt-paused', async () => {
        const time = now();
        const offset = 2_000;
        const firstWaitTime = 50;
        const secondWaitTime = 50;

        const modules = getSplitterinoStoreModules(createMockInjector());
        modules.timer.state = {
            ...modules.timer.state as TimerState,
            status: TimerStatus.PAUSED,
            startTime: time - offset,
            pauseTime: time,
        };

        const store = new Store<RootState>({
            modules: {
                splitterino: {
                    namespaced: true,
                    modules,
                }
            }
        });

        const component = mount(TimerComponent, {
            localVue: setupVueInstance(),
            mocks: { $store: store },
        });

        expect(component.vm.$data.currentTime)
            .to.be.within(offset, offset + maxTimeDeviation);
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = 0; i <= maxTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(firstWaitTime);

        // Pausing the timer
        store.commit(MUTATION_SET_STATUS, TimerStatus.RUNNING_IGT_PAUSE);

        await wait(secondWaitTime);

        expect(component.vm.$data.currentTime)
            .to.be.within(offset + secondWaitTime, offset + secondWaitTime + maxTimeDeviation);
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = 0; i <= maxTimeDeviation; i++) {
            secondValidTimes.push(formatter.format(offset + secondWaitTime + i));
        }
        expect(secondText).to.be.oneOf(secondValidTimes);
    });

    it('should stop updating when the igt timer changes to paused', async () => {
        const time = now();
        const offset = 2_000;
        const firstWaitTime = 50;
        const secondWaitTime = 50;

        const modules = getSplitterinoStoreModules(createMockInjector());
        modules.timer.state = {
            ...modules.timer.state as TimerState,
            status: TimerStatus.RUNNING,
            startTime: time - offset,
        };

        const store = new Store<RootState>({
            modules: {
                splitterino: {
                    namespaced: true,
                    modules,
                }
            }
        });

        const component = mount(TimerComponent, {
            localVue: setupVueInstance(),
            mocks: { $store: store },
            propsData: { igt: true },
        });

        expect(component.vm.$data.currentTime)
            .to.be.within(offset, offset + maxTimeDeviation);
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = 0; i <= maxTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(firstWaitTime);

        // Pausing the timer
        store.commit(MUTATION_SET_STATUS, TimerStatus.PAUSED);

        await wait(secondWaitTime);

        expect(component.vm.$data.currentTime)
            .to.be.within(offset + firstWaitTime, offset + firstWaitTime + maxTimeDeviation);
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = 0; i <= maxTimeDeviation; i++) {
            secondValidTimes.push(formatter.format(offset + firstWaitTime + i));
        }
        expect(secondText).to.be.oneOf(secondValidTimes);
    });

    it('should stop updating when the igt timer changes to running-igt-paused', async () => {
        const time = now();
        const offset = 2_000;
        const firstWaitTime = 50;
        const secondWaitTime = 50;

        const modules = getSplitterinoStoreModules(createMockInjector());
        modules.timer.state = {
            ...modules.timer.state as TimerState,
            status: TimerStatus.RUNNING,
            startTime: time - offset,
        };

        const store = new Store<RootState>({
            modules: {
                splitterino: {
                    namespaced: true,
                    modules,
                }
            }
        });

        const component = mount(TimerComponent, {
            localVue: setupVueInstance(),
            mocks: { $store: store },
            propsData: { igt: true },
        });

        expect(component.vm.$data.currentTime)
            .to.be.within(offset, offset + maxTimeDeviation);
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = 0; i <= maxTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(firstWaitTime);

        // Pausing the timer
        store.commit(MUTATION_SET_STATUS, TimerStatus.RUNNING_IGT_PAUSE);

        await wait(secondWaitTime);

        expect(component.vm.$data.currentTime)
            .to.be.within(offset + firstWaitTime, offset + firstWaitTime + maxTimeDeviation);
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = 0; i <= maxTimeDeviation; i++) {
            secondValidTimes.push(formatter.format(offset + firstWaitTime + i));
        }
        expect(secondText).to.be.oneOf(secondValidTimes);
    });

    it('should start updating the igt timer when it changes to running', async () => {
        const time = now();
        const offset = 2_000;
        const firstWaitTime = 50;
        const secondWaitTime = 50;

        const modules = getSplitterinoStoreModules(createMockInjector());
        modules.timer.state = {
            ...modules.timer.state as TimerState,
            status: TimerStatus.PAUSED,
            startTime: time - offset,
            igtPauseTime: time,
        };

        const store = new Store<RootState>({
            modules: {
                splitterino: {
                    namespaced: true,
                    modules,
                }
            }
        });

        const component = mount(TimerComponent, {
            localVue: setupVueInstance(),
            mocks: { $store: store },
            propsData: { igt: true },
        });

        expect(component.vm.$data.currentTime)
            .to.be.within(offset, offset + maxTimeDeviation);
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = 0; i <= maxTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(firstWaitTime);

        // Pausing the timer
        store.commit(MUTATION_SET_STATUS, TimerStatus.RUNNING);

        await wait(secondWaitTime);

        expect(component.vm.$data.currentTime)
            .to.be.within(offset + secondWaitTime, offset + secondWaitTime + maxTimeDeviation);
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = 0; i <= maxTimeDeviation; i++) {
            secondValidTimes.push(formatter.format(offset + secondWaitTime + i));
        }
        expect(secondText).to.be.oneOf(secondValidTimes);
    });

    it('should not start updating the igt timer when it changes to running-igt-paused', async () => {
        const time = now();
        const offset = 2_000;
        const firstWaitTime = 50;
        const secondWaitTime = 50;

        const modules = getSplitterinoStoreModules(createMockInjector());
        modules.timer.state = {
            ...modules.timer.state as TimerState,
            status: TimerStatus.PAUSED,
            startTime: time - offset,
            igtPauseTime: time,
        };

        const store = new Store<RootState>({
            modules: {
                splitterino: {
                    namespaced: true,
                    modules,
                }
            }
        });

        const component = mount(TimerComponent, {
            localVue: setupVueInstance(),
            mocks: { $store: store },
            propsData: { igt: true },
        });

        expect(component.vm.$data.currentTime)
            .to.be.within(offset, offset + maxTimeDeviation);
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = 0; i <= maxTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(firstWaitTime);

        // Pausing the timer
        store.commit(MUTATION_SET_STATUS, TimerStatus.RUNNING_IGT_PAUSE);

        await wait(secondWaitTime);

        expect(component.vm.$data.currentTime)
            .to.be.within(offset, offset + maxTimeDeviation);
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = 0; i <= maxTimeDeviation; i++) {
            secondValidTimes.push(formatter.format(offset + i));
        }
        expect(secondText).to.be.oneOf(secondValidTimes);
    });
});
