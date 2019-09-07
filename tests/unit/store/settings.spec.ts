import { expect } from 'chai';
import Vue from 'vue';
import Vuex, { Module } from 'vuex';

import { getSettingsStoreModule, MUTATION_SET_ALL_SETTINGS, ID_MUTATION_SET_ALL_SETTINGS, MUTATION_BULK_SET_SETTINGS, ID_MUTATION_BULK_SET_SETTINGS, ACTION_SET_ALL_SETTINGS, ID_ACTION_SET_ALL_SETTINGS, ACTION_BULK_SET_SETTINGS, ID_ACTION_BULK_SET_SETTINGS, GETTER_VALUE_BY_PATH, ID_GETTER_GET_VALUE_BY_PATH, GETTER_CONFIGURATIONS_BY_PATH, ID_GETTER_GET_CONFIGURATIONS_BY_PATH } from '../../../src/store/modules/settings.module';
import { RootState } from '../../../src/store/states/root.state';
import { SettingsState, Settings } from '../../../src/store/states/settings.state';
import { createMockInjector, testAction } from '../../utils';
import { eventHub } from '../../../src/utils/event-hub';
import { ID_ACTION_SET_ALL_SEGMENTS } from '../../../src/store/modules/splits.module';

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
    const settingsModule: Module<SettingsState, RootState> = getSettingsStoreModule();

    it('should be a valid module', () => {
        expect(settingsModule).to.be.an('object');
        // tslint:disable-next-line no-unused-expression
        expect(settingsModule).to.have.property('state').and.to.be.an('object').which.has.keys;
        // tslint:disable-next-line no-unused-expression
        expect(settingsModule).to.have.property('mutations').and.to.be.an('object').which.has.keys;
        // tslint:disable-next-line no-unused-expression
        expect(settingsModule).to.have.property('actions').and.to.be.an('object').which.has.keys;
    });

    describe('mutations', () => {
        describe(MUTATION_SET_ALL_SETTINGS, () => {
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
                settingsModule.mutations[ID_MUTATION_SET_ALL_SETTINGS](cleanState, { values: newSettings });
                expect(cleanState.values).to.eql(newSettings);
            });
        });

        describe(MUTATION_BULK_SET_SETTINGS, () => {
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
                settingsModule.mutations[ID_MUTATION_BULK_SET_SETTINGS](cleanState, { values: newSettings });
                expect(cleanState.values).to.eql(newSettings);
            });

            it('should only emit events for changed settings', async () => {
                const messages: string[] = [];

                eventHub.$on('setting-changed:splitterino.core.test.mySetting', () => {
                    messages.push('mySetting');
                });

                // Dummy listener that should not fire
                eventHub.$on('setting-changed:splitterino.core.test.doNotChange', () => {
                    messages.push('doNotChange');
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

                settingsModule.mutations[ID_MUTATION_BULK_SET_SETTINGS](cleanState, { values: newSettings });

                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (messages.length !== 1) {
                            reject();
                        }

                        if (messages[0] !== 'mySetting') {
                            reject();
                        }

                        resolve();
                    }, 1);
                });
            });

            it('should emit the changed setting', async () => {
                const messages: any[] = [];

                eventHub.$on('setting-changed:splitterino.core.test.mySetting', setting => {
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

                settingsModule.mutations[ID_MUTATION_BULK_SET_SETTINGS](cleanState, { values: newSettings });

                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (messages.length !== 1) {
                            reject();
                        }

                        if (messages[0] !== 9999) {
                            reject();
                        }

                        resolve();
                    }, 1);
                });
            });
        });
    });

    describe('actions', () => {
        describe(ACTION_SET_ALL_SETTINGS, () => {
            it(`it should call ${ID_MUTATION_SET_ALL_SETTINGS}`, async () => {
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
                // tslint:disable-next-line:no-unused-expression
                expect(dispatches).to.be.empty;
                // tslint:disable-next-line:no-unused-expression
                expect(commits[0].payload.values).to.eql(newSettings);
            });
        });

        describe(ACTION_BULK_SET_SETTINGS, () => {
            it(`it should call ${ID_MUTATION_BULK_SET_SETTINGS}`, async () => {
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
                // tslint:disable-next-line:no-unused-expression
                expect(dispatches).to.be.empty;
                // tslint:disable-next-line:no-unused-expression
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

                // tslint:disable-next-line:no-unused-expression
                expect(setting).to.be.null;
            });

            it('should return a given default when value does not exist', () => {
                const cleanState = generateEmptyState();

                const setting = settingsModule.getters[ID_GETTER_GET_VALUE_BY_PATH](
                    cleanState, null, null, null
                )('splitterino.core.test.mySetting', 10000);

                // tslint:disable-next-line:no-unused-expression
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
