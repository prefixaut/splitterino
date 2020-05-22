/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import { Subscription } from 'rxjs';

import { IPC_CLIENT_SERVICE_TOKEN } from '../../../src/models/services';
import { Settings, SettingsState } from '../../../src/models/states/settings.state';
import { Module } from '../../../src/store';
import {
    getConfigurationByPath,
    getSettingsStoreModule,
    getValueByPath,
    ID_HANDLER_BULK_SET_SETTINGS,
    ID_HANDLER_SET_ALL_SETTINGS,
} from '../../../src/store/modules/settings.module';
import { createMockInjector } from '../../utils';

const injector = createMockInjector();

function generateDummyConfiguration(settingsModule: Module<SettingsState>): SettingsState {
    const state = settingsModule.initialize();
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
        expect(settingsModule).to.be.a('object');
        expect(settingsModule).to.have.property('handlers').which.is.a('object').and.has.keys;
        expect(settingsModule).to.have.property('initialize').which.is.a('function');

        const state = settingsModule.initialize();
        expect(state).to.be.a('object').and.to.have.keys;
    });

    describe('Handlers', () => {
        describe(ID_HANDLER_SET_ALL_SETTINGS, () => {
            it('should set all settings values', () => {
                const newSettings: Settings = {
                    splitterino: {
                        core: {
                            test: {}
                        }
                    },
                    plugins: {}
                };
                const state = settingsModule.initialize();
                const diff = settingsModule.handlers[ID_HANDLER_SET_ALL_SETTINGS](state, {
                    values: newSettings
                });
                expect(diff).to.deep.equal({ values: newSettings });
            });
        });

        describe(ID_HANDLER_BULK_SET_SETTINGS, () => {
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
                const state = settingsModule.initialize();
                const diff = settingsModule.handlers[ID_HANDLER_BULK_SET_SETTINGS](state, {
                    values: newSettings
                });
                expect(diff).to.deep.equal({ values: newSettings });
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
                const state = settingsModule.initialize();
                state.values.splitterino.core.test = {
                    mySetting: 1,
                    doNotChange: 'hello',
                };

                settingsModule.handlers[ID_HANDLER_BULK_SET_SETTINGS](state, {
                    values: newSettings
                });

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
                const state = settingsModule.initialize();
                state.values.splitterino.core.test = {
                    mySetting: 1,
                    doNotChange: 'hello',
                };

                settingsModule.handlers[ID_HANDLER_BULK_SET_SETTINGS](state, {
                    values: newSettings
                });

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

    describe('Getters', () => {
        describe('getValueByPath', () => {
            it('should get a value if it exists', () => {
                const state = settingsModule.initialize();
                state.values.splitterino.core.test = {
                    mySetting: 1,
                };

                const setting = getValueByPath(state)('splitterino.core.test.mySetting');

                expect(setting).to.equal(1);
            });

            it('should return null for non existing values and when not default was given', () => {
                const state = settingsModule.initialize();

                const setting = getValueByPath(state)('splitterino.core.test.mySetting');

                expect(setting).to.be.null;
            });

            it('should return a given default when value does not exist', () => {
                const state = settingsModule.initialize();

                const setting = getValueByPath(state)('splitterino.core.test.mySetting', 10_000);

                expect(setting).to.equal(10000);
            });
        });

        describe('getConfigurationByPath', () => {
            it('should get the configuration for a given path', () => {
                const state = generateDummyConfiguration(settingsModule);

                const config = getConfigurationByPath(state)('splitterino.core.splits');

                expect(config).to.deep.equal(state.configuration.splitterino[0].groups[0].settings);
            });

            it('should return [] if the path is not the correct length', () => {
                const state = generateDummyConfiguration(settingsModule);

                const config = getConfigurationByPath(state)('splitterino.core');

                expect(config).to.deep.equal([]);
            });

            it('should return [] if the module does not exist', () => {
                const state = generateDummyConfiguration(settingsModule);

                const config = getConfigurationByPath(state)('doesNotExist.core.splits');

                expect(config).to.deep.equal([]);
            });

            it('should return [] if the namespace does not exist', () => {
                const state = generateDummyConfiguration(settingsModule);

                const config = getConfigurationByPath(state)('splitterino.doesNotExist.splits');

                expect(config).to.eql([]);
            });

            it('should return [] if the group does not exist', () => {
                const state = generateDummyConfiguration(settingsModule);

                const config = getConfigurationByPath(state)('splitterino.core.doesNotExist');

                expect(config).to.deep.equal([]);
            });
        });
    });
});
