import { createLocalVue, mount } from '@vue/test-utils';
import { Aevum } from 'aevum';
import { expect } from 'chai';
import { Store } from 'vuex';

import { DEFAULT_TIMER_FORMAT } from '../../../src/common/constants';
import { TimerStatus } from '../../../src/common/timer-status';
import TimerComponent from '../../../src/components/timer.vue';
import { aevumFilter } from '../../../src/filters/aevum.filter';
import { getSplitterinoStoreModules } from '../../../src/store/modules/index.module';
import { MUTATION_SET_STATUS } from '../../../src/store/modules/timer.module';
import { RootState } from '../../../src/store/states/root.state';
import { TimerState } from '../../../src/store/states/timer.state';
import { now } from '../../../src/utils/time';
import { createMockInjector, randomInt, wait } from '../../utils';

function setupVueInstance() {
    const localVue = createLocalVue();

    localVue.filter('aevum', aevumFilter);

    return localVue;
}

// Deviation times, as the rendering can be a bit delayed

/** Allowed deviation that the timer is allowed to be in front of the time */
const maxPreTimeDeviation = 5;
/** Allowed deviation that the timer is allowed to be over of the time */
const maxPostTimeDeviation = 20;

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

        expect(component.vm.$data.currentTime).to.be.within(
            offset - maxPreTimeDeviation,
            offset + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(waitTime);

        expect(component.vm.$data.currentTime).to.be.within(
            (offset + waitTime) - maxPreTimeDeviation,
            offset + waitTime + maxPostTimeDeviation
        );
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
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

        expect(component.vm.$data.currentTime).to.be.within(
            (offset - pauseTime) - maxPreTimeDeviation,
            (offset - pauseTime) + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format((offset - pauseTime) + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(waitTime);

        expect(component.vm.$data.currentTime).to.be.within(
            (offset - pauseTime) + waitTime - maxPreTimeDeviation,
            (offset - pauseTime) + waitTime + maxPostTimeDeviation
        );
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
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

        expect(component.vm.$data.currentTime).to.be.within(
            offset - maxPreTimeDeviation,
            offset + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(waitTime);

        expect(component.vm.$data.currentTime).to.be.within(
            (offset + waitTime) - maxPreTimeDeviation,
            offset + waitTime + maxPostTimeDeviation
        );
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
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

        expect(component.vm.$data.currentTime).to.be.within(
            offset - maxPreTimeDeviation,
            offset + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(waitTime);

        expect(component.vm.$data.currentTime).to.be.within(
            (offset + waitTime) - maxPreTimeDeviation,
            offset + waitTime + maxPostTimeDeviation
        );
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
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

        expect(component.vm.$data.currentTime).to.be.within(
            (offset - pauseTime) - maxPreTimeDeviation,
            (offset - pauseTime) + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format((offset - pauseTime) + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(waitTime);

        expect(component.vm.$data.currentTime).to.be.within(
            ((offset - pauseTime) + waitTime) - maxPreTimeDeviation,
            (offset - pauseTime) + waitTime + maxPostTimeDeviation
        );
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
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

        expect(component.vm.$data.currentTime).to.be.within(
            offset - maxPreTimeDeviation,
            offset + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(waitTime);

        expect(component.vm.$data.currentTime).to.be.within(
            (offset + waitTime) - maxPreTimeDeviation,
            offset + waitTime + maxPostTimeDeviation
        );
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
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

        expect(component.vm.$data.currentTime).to.be.within(
            offset - maxPreTimeDeviation,
            offset + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(firstWaitTime);

        // Pausing the timer
        store.commit(MUTATION_SET_STATUS, TimerStatus.PAUSED);

        await wait(secondWaitTime);

        expect(component.vm.$data.currentTime).to.be.within(
            (offset + firstWaitTime) - maxPreTimeDeviation,
            offset + firstWaitTime + maxPostTimeDeviation
        );
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
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

        expect(component.vm.$data.currentTime).to.be.within(
            offset - maxPreTimeDeviation,
            offset + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(firstWaitTime);

        // Pausing the timer
        store.commit(MUTATION_SET_STATUS, TimerStatus.RUNNING);

        await wait(secondWaitTime);

        expect(component.vm.$data.currentTime).to.be.within(
            (offset + totalWaitTime) - maxPreTimeDeviation,
            offset + totalWaitTime + maxPostTimeDeviation
        );
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
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

        expect(component.vm.$data.currentTime).to.be.within(
            offset - maxPreTimeDeviation,
            offset + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(firstWaitTime);

        // Pausing the timer
        store.commit(MUTATION_SET_STATUS, TimerStatus.RUNNING);

        await wait(secondWaitTime);

        expect(component.vm.$data.currentTime).to.be.within(
            (offset + secondWaitTime) - maxPreTimeDeviation,
            offset + secondWaitTime + maxPostTimeDeviation
        );
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
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

        expect(component.vm.$data.currentTime).to.be.within(
            offset - maxPreTimeDeviation,
            offset + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(firstWaitTime);

        // Pausing the timer
        store.commit(MUTATION_SET_STATUS, TimerStatus.RUNNING_IGT_PAUSE);

        await wait(secondWaitTime);

        expect(component.vm.$data.currentTime).to.be.within(
            (offset + secondWaitTime) - maxPreTimeDeviation,
            offset + secondWaitTime + maxPostTimeDeviation
        );
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            secondValidTimes.push(formatter.format(offset + secondWaitTime + i));
        }
        expect(secondText).to.be.oneOf(
            secondValidTimes,
            `expected ${secondText} to be one of ${JSON.stringify(secondValidTimes)}`
        );
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

        expect(component.vm.$data.currentTime).to.be.within(
            offset - maxPreTimeDeviation,
            offset + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(firstWaitTime);

        // Pausing the timer
        store.commit(MUTATION_SET_STATUS, TimerStatus.PAUSED);

        await wait(secondWaitTime);

        expect(component.vm.$data.currentTime).to.be.within(
            (offset + firstWaitTime) - maxPreTimeDeviation,
            offset + firstWaitTime + maxPostTimeDeviation
        );
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
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

        expect(component.vm.$data.currentTime).to.be.within(
            offset - maxPreTimeDeviation,
            offset + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(firstWaitTime);

        // Pausing the timer
        store.commit(MUTATION_SET_STATUS, TimerStatus.RUNNING_IGT_PAUSE);

        await wait(secondWaitTime);

        expect(component.vm.$data.currentTime).to.be.within(
            (offset + firstWaitTime) - maxPreTimeDeviation,
            offset + firstWaitTime + maxPostTimeDeviation
        );
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
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

        expect(component.vm.$data.currentTime).to.be.within(
            offset - maxPreTimeDeviation,
            offset + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(firstWaitTime);

        // Pausing the timer
        store.commit(MUTATION_SET_STATUS, TimerStatus.RUNNING);

        await wait(secondWaitTime);

        expect(component.vm.$data.currentTime).to.be.within(
            (offset + secondWaitTime) - maxPreTimeDeviation,
            offset + secondWaitTime + maxPostTimeDeviation
        );
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
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

        expect(component.vm.$data.currentTime).to.be.within(
            offset - maxPreTimeDeviation,
            offset + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(firstWaitTime);

        // Pausing the timer
        store.commit(MUTATION_SET_STATUS, TimerStatus.RUNNING_IGT_PAUSE);

        await wait(secondWaitTime);

        expect(component.vm.$data.currentTime).to.be.within(
            offset - maxPreTimeDeviation,
            offset + maxPostTimeDeviation
        );
        const secondText = component.find('.content').text();
        const secondValidTimes = [];
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            secondValidTimes.push(formatter.format(offset + i));
        }
        expect(secondText).to.be.oneOf(secondValidTimes);
    });

    it('should pause the timer and display the final rta-time when it changes to finished', async () => {
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

        expect(component.vm.$data.currentTime).to.be.within(
            offset - maxPreTimeDeviation,
            offset + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(firstWaitTime);

        // Pausing the timer
        const finishTime = now();
        store.commit(MUTATION_SET_STATUS, { status: TimerStatus.FINISHED, time: finishTime });

        await wait(secondWaitTime);

        const finalTime = offset + (finishTime - time);
        expect(component.vm.$data.currentTime).to.equal(finalTime);

        const secondText = component.find('.content').text();
        expect(secondText).to.equal(formatter.format(finalTime));
    });

    it('should pause the timer and display the final rta-time (with pauses) when it changes to finished', async () => {
        const time = now();
        const offset = 2_000;
        const pauseTime = randomInt(300, 50);
        const firstWaitTime = 50;
        const secondWaitTime = 50;

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

        expect(component.vm.$data.currentTime).to.be.within(
            offset - pauseTime - maxPreTimeDeviation,
            offset - pauseTime + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format(offset - pauseTime + i));
        }
        expect(text).to.be.oneOf(validTimes, JSON.stringify(validTimes));

        await wait(firstWaitTime);

        // Pausing the timer
        const finishTime = now();
        store.commit(MUTATION_SET_STATUS, { status: TimerStatus.FINISHED, time: finishTime });

        await wait(secondWaitTime);

        const finalTime = offset + (finishTime - time - pauseTime);
        expect(component.vm.$data.currentTime).to.equal(finalTime);

        const secondText = component.find('.content').text();
        expect(secondText).to.equal(formatter.format(finalTime));
    });

    it('should pause the timer and display the final rta-time (with delay) when it changes to finished', async () => {
        const time = now();
        const offset = 2_000;
        const delayTime = randomInt(300, 50);
        const firstWaitTime = 50;
        const secondWaitTime = 50;

        const modules = getSplitterinoStoreModules(createMockInjector());
        modules.timer.state = {
            ...modules.timer.state as TimerState,
            status: TimerStatus.RUNNING,
            startTime: time - offset,
            startDelay: delayTime,
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

        expect(component.vm.$data.currentTime).to.be.within(
            offset - delayTime - maxPreTimeDeviation,
            offset - delayTime + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format(offset - delayTime + i));
        }
        expect(text).to.be.oneOf(validTimes, JSON.stringify(validTimes));

        await wait(firstWaitTime);

        // Pausing the timer
        const finishTime = now();
        store.commit(MUTATION_SET_STATUS, { status: TimerStatus.FINISHED, time: finishTime });

        await wait(secondWaitTime);

        const finalTime = offset + (finishTime - time - delayTime);
        expect(component.vm.$data.currentTime).to.equal(finalTime);

        const secondText = component.find('.content').text();
        expect(secondText).to.equal(formatter.format(finalTime));
    });

    it('should pause the timer and display the final igt-time when it changes to finished', async () => {
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

        expect(component.vm.$data.currentTime).to.be.within(
            offset - maxPreTimeDeviation,
            offset + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format(offset + i));
        }
        expect(text).to.be.oneOf(validTimes);

        await wait(firstWaitTime);

        // Pausing the timer
        const finishTime = now();
        store.commit(MUTATION_SET_STATUS, { status: TimerStatus.FINISHED, time: finishTime });

        await wait(secondWaitTime);

        const finalTime = offset + (finishTime - time);
        expect(component.vm.$data.currentTime).to.equal(finalTime);

        const secondText = component.find('.content').text();
        expect(secondText).to.equal(formatter.format(finalTime));
    });

    it('should pause the timer and display the final igt-time (with pauses) when it changes to finished', async () => {
        const time = now();
        const offset = 2_000;
        const pauseTime = randomInt(300, 50);
        const firstWaitTime = 50;
        const secondWaitTime = 50;

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

        expect(component.vm.$data.currentTime).to.be.within(
            offset - pauseTime - maxPreTimeDeviation,
            offset - pauseTime + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format(offset - pauseTime + i));
        }
        expect(text).to.be.oneOf(validTimes, JSON.stringify(validTimes));

        await wait(firstWaitTime);

        // Pausing the timer
        const finishTime = now();
        store.commit(MUTATION_SET_STATUS, { status: TimerStatus.FINISHED, time: finishTime });

        await wait(secondWaitTime);

        const finalTime = offset + (finishTime - time - pauseTime);
        expect(component.vm.$data.currentTime).to.equal(finalTime);

        const secondText = component.find('.content').text();
        expect(secondText).to.equal(formatter.format(finalTime));
    });

    it('should pause the timer and display the final igt-time (with delay) when it changes to finished', async () => {
        const time = now();
        const offset = 2_000;
        const delayTime = randomInt(300, 50);
        const firstWaitTime = 50;
        const secondWaitTime = 50;

        const modules = getSplitterinoStoreModules(createMockInjector());
        modules.timer.state = {
            ...modules.timer.state as TimerState,
            status: TimerStatus.RUNNING,
            startTime: time - offset,
            startDelay: delayTime,
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

        expect(component.vm.$data.currentTime).to.be.within(
            offset - delayTime - maxPreTimeDeviation,
            offset - delayTime + maxPostTimeDeviation
        );
        const text = component.find('.content').text();
        const validTimes = [];
        const formatter = new Aevum(DEFAULT_TIMER_FORMAT);
        for (let i = maxPreTimeDeviation * -1; i <= maxPostTimeDeviation; i++) {
            validTimes.push(formatter.format(offset - delayTime + i));
        }
        expect(text).to.be.oneOf(validTimes, JSON.stringify(validTimes));

        await wait(firstWaitTime);

        // Pausing the timer
        const finishTime = now();
        store.commit(MUTATION_SET_STATUS, { status: TimerStatus.FINISHED, time: finishTime });

        await wait(secondWaitTime);

        const finalTime = offset + (finishTime - time - delayTime);
        expect(component.vm.$data.currentTime).to.equal(finalTime);

        const secondText = component.find('.content').text();
        expect(secondText).to.equal(formatter.format(finalTime));
    });
});
