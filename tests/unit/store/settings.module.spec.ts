/* eslint-disable no-unused-expressions */
import { expect } from 'chai';

import { RootState } from '../../../src/models/states/root.state';
import { Settings, SettingsState } from '../../../src/models/states/settings.state';
import {
    getSettingsStoreModule,
    ID_HANDLER_BULK_SET_SETTINGS,
    ID_HANDLER_SET_ALL_SETTINGS,
    HANDLER_BULK_SET_SETTINGS,
    HANDLER_SET_ALL_SETTINGS,
} from '../../../src/store/modules/settings.module';
import { createMockInjector, testAction } from '../../utils';
import { IPC_CLIENT_SERVICE_TOKEN } from '../../../src/models/ipc';
import { Subscription } from 'rxjs';
import { Module } from 'vuex';

const injector = createMockInjector();

Vue.use(Vuex);

function generateEmptyState(): SettingsState {
    return {
        configuration: {
            splitterino: [],
            plugins: []
        },
        values: {
            splitterino: {
                core: {}
            },
            plugins: {}
        }
    };
}

function generateDummyConfiguration(): SettingsState {
    const state = generateEmptyState();
    const settings = [
        {
            key: 'pinLastSegment',
            label: 'Pin the last Segment',
            component: 'spl-checkbox',
            componentProps: {},
            defaultValue: false,
        },
    ];

    state.configuration.splitterino.push({
        key: 'core',
        label: 'Core',
        groups: [
            {
                key: 'splits',
                label: 'Splits',
                settings
            }
        ]
    });

    return state;
}

describe('Settings Store-Module', () => {
    const settingsModule: Module<SettingsState> = getSettingsStoreModule(injector);

    it('should be a valid module', () => {
        expect(settingsModule).to.be.an('object');
        expect(settingsModule).to.have.property('state').and.to.be.an('object').which.has.keys;
        expect(settingsModule).to.have.property('mutations').and.to.be.an('object').which.has.keys;
        expect(settingsModule).to.have.property('actions').and.to.be.an('object').which.has.keys;
    });

    describe('mutations', () => {
        describe(HANDLER_SET_ALL_SETTINGS, () => {
            it('should set all settings values', () => {
                const newSettings: Settings = {
                    splitterino: {
                        core: {
                            test: {}
                        }
                    },
                    plugins: {}
                };
                const cleanState = generateEmptyState();
                settingsModule.mutations[ID_HANDLER_SET_ALL_SETTINGS](cleanState, { values: newSettings });
                expect(cleanState.values).to.eql(newSettings);
            });
        });

        describe(HANDLER_BULK_SET_SETTINGS, () => {
            it('should set individual settings', () => {
                const newSettings: Settings = {
                    splitterino: {
                        core: {
                            test: {
                            }
                        }
                    },
                    plugins: {}
                };
                const cleanState = generateEmptyState();
                settingsModule.mutations[ID_HANDLER_BULK_SET_SETTINGS](cleanState, { values: newSettings });
                expect(cleanState.values).to.eql(newSettings);
            });

            it('should only emit events for changed settings', async () => {
                const messages: string[] = [];
                const ipcClient = injector.get(IPC_CLIENT_SERVICE_TOKEN);
                const subscriptions: Subscription[] = [];

                const mySettingSub = ipcClient
                    .listenForLocalMessage('setting-changed:splitterino.core.test.mySetting')
                    .subscribe(() => {
                        messages.push('mySetting');
                    });
                subscriptions.push(mySettingSub);

                // Dummy listener that should not fire
                const doNotChangeSub = ipcClient
                    .listenForLocalMessage('setting-changed:splitterino.core.test.doNotChange')
                    .subscribe(() => {
                        messages.push('doNotChange');
                    });
                subscriptions.push(doNotChangeSub);

                const newSettings: Settings = {
                    splitterino: {
                        core: {
                            test: {
                                mySetting: 9999,
                                doNotChange: 'hello'
                            }
                        }
                    },
                    plugins: {}
                };
                const cleanState = generateEmptyState();
                cleanState.values.splitterino.core.test = {};
                cleanState.values.splitterino.core.test.mySetting = 1;
                cleanState.values.splitterino.core.test.doNotChange = 'hello';

                settingsModule.mutations[ID_HANDLER_BULK_SET_SETTINGS](cleanState, { values: newSettings });

                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (messages.length !== 1) {
                            reject();
                        }

                        if (messages[0] !== 'mySetting') {
                            reject();
                        }

                        for (const sub of subscriptions) {
                            sub.unsubscribe();
                        }
                        resolve();
                    }, 1);
                });
            });

            it('should emit the changed setting', async () => {
                const messages: any[] = [];

                const mySettingSub = injector.get(IPC_CLIENT_SERVICE_TOKEN)
                    .listenForLocalMessage('setting-changed:splitterino.core.test.mySetting')
                    .subscribe((setting: any) => {
                        messages.push(setting);
                    });

                const newSettings: Settings = {
                    splitterino: {
                        core: {
                            test: {
                                mySetting: 9999,
                                doNotChange: 'hello'
                            }
                        }
                    },
                    plugins: {}
                };
                const cleanState = generateEmptyState();
                cleanState.values.splitterino.core.test = {};
                cleanState.values.splitterino.core.test.mySetting = 1;
                cleanState.values.splitterino.core.test.doNotChange = 'hello';

                settingsModule.mutations[ID_HANDLER_BULK_SET_SETTINGS](cleanState, { values: newSettings });

                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (messages.length !== 1) {
                            reject();
                        }

                        if (messages[0] !== 9999) {
                            reject();
                        }

                        mySettingSub.unsubscribe();
                        resolve();
                    }, 1);
                });
            });
        });
    });

    describe('actions', () => {
        describe(ACTION_SET_ALL_SETTINGS, () => {
            it(`it should call ${ID_HANDLER_SET_ALL_SETTINGS}`, async () => {
                const rootState = {
                    splitterino: {
                        settings: generateEmptyState()
                    }
                };

                const newSettings: Settings = {
                    splitterino: {
                        core: {
                            test: {}
                        }
                    },
                    plugins: {}
                };

                const { commits, dispatches } = await testAction(
                    settingsModule.actions[ID_ACTION_SET_ALL_SETTINGS],
                    { state: generateEmptyState(), rootState },
                    { values: newSettings }
                );

                expect(commits).to.have.lengthOf(1);
                expect(dispatches).to.be.empty;
                expect(commits[0].payload.values).to.eql(newSettings);
            });
        });

        describe(ACTION_BULK_SET_SETTINGS, () => {
            it(`it should call ${ID_HANDLER_BULK_SET_SETTINGS}`, async () => {
                const rootState = {
                    splitterino: {
                        settings: generateEmptyState()
                    }
                };

                const newSettings: Settings = {
                    splitterino: {
                        core: {
                            test: {}
                        }
                    },
                    plugins: {}
                };

                const { commits, dispatches } = await testAction(
                    settingsModule.actions[ID_ACTION_BULK_SET_SETTINGS],
                    { state: generateEmptyState(), rootState },
                    { values: newSettings }
                );

                expect(commits).to.have.lengthOf(1);
                expect(dispatches).to.be.empty;
                expect(commits[0].payload.values).to.eql(newSettings);
            });
        });
    });

    describe('getters', () => {
        describe(GETTER_VALUE_BY_PATH, () => {
            it('should get a value if it exists', () => {
                const cleanState = generateEmptyState();
                cleanState.values.splitterino.core.test = {};
                cleanState.values.splitterino.core.test.mySetting = 1;

                const setting = settingsModule.getters[ID_GETTER_GET_VALUE_BY_PATH](
                    cleanState, null, null, null
                )('splitterino.core.test.mySetting');

                expect(setting).to.equal(1);
            });

            it('should return null for non existing values and when not default was given', () => {
                const cleanState = generateEmptyState();

                const setting = settingsModule.getters[ID_GETTER_GET_VALUE_BY_PATH](
                    cleanState, null, null, null
                )('splitterino.core.test.mySetting');

                expect(setting).to.be.null;
            });

            it('should return a given default when value does not exist', () => {
                const cleanState = generateEmptyState();

                const setting = settingsModule.getters[ID_GETTER_GET_VALUE_BY_PATH](
                    cleanState, null, null, null
                )('splitterino.core.test.mySetting', 10000);

                expect(setting).to.equal(10000);
            });
        });

        describe(GETTER_CONFIGURATIONS_BY_PATH, () => {
            it('should get the configuration for a given path', () => {
                const cleanState = generateDummyConfiguration();

                const config = settingsModule.getters[ID_GETTER_GET_CONFIGURATIONS_BY_PATH](
                    cleanState, null, null, null
                )('splitterino.core.splits');

                expect(config).to.eql(cleanState.configuration.splitterino[0].groups[0].settings);
            });

            it('should return [] if the path is not the correct length', () => {
                const cleanState = generateDummyConfiguration();

                const config = settingsModule.getters[ID_GETTER_GET_CONFIGURATIONS_BY_PATH](
                    cleanState, null, null, null
                )('splitterino.core');

                expect(config).to.eql([]);
            });

            it('should return [] if the module does not exist', () => {
                const cleanState = generateDummyConfiguration();

                const config = settingsModule.getters[ID_GETTER_GET_CONFIGURATIONS_BY_PATH](
                    cleanState, null, null, null
                )('doesNotExist.core.splits');

                expect(config).to.eql([]);
            });

            it('should return [] if the namespace does not exist', () => {
                const cleanState = generateDummyConfiguration();

                const config = settingsModule.getters[ID_GETTER_GET_CONFIGURATIONS_BY_PATH](
                    cleanState, null, null, null
                )('splitterino.doesNotExist.splits');

                expect(config).to.eql([]);
            });

            it('should return [] if the group does not exist', () => {
                const cleanState = generateDummyConfiguration();

                const config = settingsModule.getters[ID_GETTER_GET_CONFIGURATIONS_BY_PATH](
                    cleanState, null, null, null
                )('splitterino.core.doesNotExist');

                expect(config).to.eql([]);
            });
        });
    });
});
