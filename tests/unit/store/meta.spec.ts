import { expect } from 'chai';
import Vue from 'vue';
import Vuex, { Module } from 'vuex';

import { MetaState, RecentlyOpenedSplit, RecentlyOpenedTemplate } from '../../../src/models/states/meta.state';
import { RootState } from '../../../src/models/states/root.state';
import {
    ACTION_ADD_OPENED_SPLITS_FILE,
    ACTION_ADD_OPENED_TEMPLATE_FILE,
    ACTION_SET_LAST_OPENED_SPLITS_FILES,
    ACTION_SET_LAST_OPENED_TEMPLATE_FILES,
    getMetaModule,
    ID_ACTION_ADD_OPENED_SPLITS_FILE,
    ID_ACTION_ADD_OPENED_TEMPLATE_FILE,
    ID_ACTION_SET_LAST_OPENED_SPLITS_FILES,
    ID_ACTION_SET_LAST_OPENED_TEMPLATE_FILES,
    ID_MUTATION_ADD_OPENED_SPLITS_FILE,
    ID_MUTATION_ADD_OPENED_TEMPLATE_FILE,
    ID_MUTATION_SET_LAST_OPENED_SPLITS_FILES,
    ID_MUTATION_SET_LAST_OPENED_TEMPLATE_FILES,
    MUTATION_ADD_OPENED_SPLITS_FILE,
    MUTATION_ADD_OPENED_TEMPLATE_FILE,
    MUTATION_SET_LAST_OPENED_SPLITS_FILES,
    MUTATION_SET_LAST_OPENED_TEMPLATE_FILES,
} from '../../../src/store/modules/meta.module';
import { testAction } from '../../utils';

Vue.use(Vuex);

function generateEmptyState(): MetaState {
    return {
        lastOpenedSplitsFiles: [],
        lastOpenedTemplateFiles: []
    };
}

function generateRandomSplitFileEntries(count: number = 10): RecentlyOpenedSplit[] {
    const splitFiles: RecentlyOpenedSplit[] = [];
    for (let i = 0; i < count; i++) {
        splitFiles.push({
            gameName: i.toString(),
            category: i.toString(),
            path: i.toString()
        });
    }

    return splitFiles;
}

function generateRandomTemplateFileEntries(count: number = 10): RecentlyOpenedTemplate[] {
    const templateFiles: RecentlyOpenedTemplate[] = [];
    for (let i = 0; i < count; i++) {
        templateFiles.push({
            name: i.toString(),
            author: i.toString(),
            path: i.toString()
        });
    }

    return templateFiles;
}

describe('Settings Store-Module', () => {
    const metaModule: Module<MetaState, RootState> = getMetaModule();

    it('should be a valid module', () => {
        expect(metaModule).to.be.an('object');
        // tslint:disable-next-line no-unused-expression
        expect(metaModule).to.have.property('state').and.to.be.an('object').which.has.keys;
        // tslint:disable-next-line no-unused-expression
        expect(metaModule).to.have.property('mutations').and.to.be.an('object').which.has.keys;
        // tslint:disable-next-line no-unused-expression
        expect(metaModule).to.have.property('actions').and.to.be.an('object').which.has.keys;
    });

    describe('mutations', () => {
        describe(MUTATION_SET_LAST_OPENED_SPLITS_FILES, () => {
            it('should set the last opened splits files', () => {
                const recentlyOpenedSplits: RecentlyOpenedSplit[] = [{
                    gameName: 'test',
                    category: 'foo',
                    path: '/path/to/file'
                }];
                const cleanState = generateEmptyState();
                metaModule.mutations[ID_MUTATION_SET_LAST_OPENED_SPLITS_FILES](
                    cleanState,
                    recentlyOpenedSplits
                );
                expect(cleanState.lastOpenedSplitsFiles).to.eql(recentlyOpenedSplits);
            });
        });

        describe(MUTATION_ADD_OPENED_SPLITS_FILE, () => {
            it('should add a splits file to recently opened ones', () => {
                const recentlyOpenedSplit: RecentlyOpenedSplit = {
                    gameName: 'test',
                    category: 'foo',
                    path: '/path/to/file'
                };
                const cleanState = generateEmptyState();
                metaModule.mutations[ID_MUTATION_ADD_OPENED_SPLITS_FILE](
                    cleanState,
                    recentlyOpenedSplit
                );
                expect(cleanState.lastOpenedSplitsFiles[0]).to.eql(recentlyOpenedSplit);
            });

            it('should push a split to first place if its already in array', () => {
                const recentlyOpenedSplit: RecentlyOpenedSplit = {
                    gameName: 'test',
                    category: 'foo',
                    path: '/path/to/file'
                };
                const randomSplitFile: RecentlyOpenedSplit = {
                    gameName: 'foobar',
                    category: 'bar',
                    path: '/some/path'
                };
                const cleanState = generateEmptyState();
                cleanState.lastOpenedSplitsFiles = [
                    randomSplitFile,
                    recentlyOpenedSplit
                ];
                metaModule.mutations[ID_MUTATION_ADD_OPENED_SPLITS_FILE](
                    cleanState,
                    recentlyOpenedSplit
                );
                expect(cleanState.lastOpenedSplitsFiles).to.eql([
                    recentlyOpenedSplit,
                    randomSplitFile
                ]);
            });

            it('should remove the last split file if the array length is > 10', () => {
                const recentlyOpenedSplit: RecentlyOpenedSplit = {
                    gameName: 'test',
                    category: 'foo',
                    path: '/path/to/file'
                };
                const cleanState = generateEmptyState();
                cleanState.lastOpenedSplitsFiles = generateRandomSplitFileEntries();
                metaModule.mutations[ID_MUTATION_ADD_OPENED_SPLITS_FILE](
                    cleanState,
                    recentlyOpenedSplit
                );
                expect(cleanState.lastOpenedSplitsFiles.length).to.equal(10);
                expect(cleanState.lastOpenedSplitsFiles[0]).to.eql(recentlyOpenedSplit);
            });
        });

        describe(MUTATION_SET_LAST_OPENED_TEMPLATE_FILES, () => {
            it('should set the last opened template files', () => {
                const recentlyOpenedTemplates: RecentlyOpenedTemplate[] = [{
                    name: 'test',
                    author: 'foo',
                    path: '/path/to/template'
                }];
                const cleanState = generateEmptyState();
                metaModule.mutations[ID_MUTATION_SET_LAST_OPENED_TEMPLATE_FILES](
                    cleanState,
                    recentlyOpenedTemplates
                );
                expect(cleanState.lastOpenedTemplateFiles).to.eql(recentlyOpenedTemplates);
            });
        });

        describe(MUTATION_ADD_OPENED_TEMPLATE_FILE, () => {
            it('should add a template file to recently opened ones', () => {
                const recentlyOpenedTemplate: RecentlyOpenedTemplate = {
                    name: 'test',
                    author: 'foo',
                    path: '/path/to/template'
                };
                const cleanState = generateEmptyState();
                metaModule.mutations[ID_MUTATION_ADD_OPENED_TEMPLATE_FILE](
                    cleanState,
                    recentlyOpenedTemplate
                );
                expect(cleanState.lastOpenedTemplateFiles[0]).to.eql(recentlyOpenedTemplate);
            });

            it('should push a split to first place if its already in array', () => {
                const recentlyOpenedTemplate: RecentlyOpenedTemplate = {
                    name: 'test',
                    author: 'foo',
                    path: '/path/to/template'
                };
                const randomTemplateFile: RecentlyOpenedTemplate = {
                    name: 'foobar',
                    author: 'bar',
                    path: '/some/path'
                };
                const cleanState = generateEmptyState();
                cleanState.lastOpenedTemplateFiles = [
                    randomTemplateFile,
                    recentlyOpenedTemplate
                ];
                metaModule.mutations[ID_MUTATION_ADD_OPENED_TEMPLATE_FILE](
                    cleanState,
                    recentlyOpenedTemplate
                );
                expect(cleanState.lastOpenedTemplateFiles).to.eql([
                    recentlyOpenedTemplate,
                    randomTemplateFile
                ]);
            });

            it('should remove the last split file if the array length is > 10', () => {
                const recentlyOpenedTemplate: RecentlyOpenedTemplate = {
                    name: 'test',
                    author: 'foo',
                    path: '/path/to/template'
                };
                const cleanState = generateEmptyState();
                cleanState.lastOpenedTemplateFiles = generateRandomTemplateFileEntries();
                metaModule.mutations[ID_MUTATION_ADD_OPENED_TEMPLATE_FILE](
                    cleanState,
                    recentlyOpenedTemplate
                );
                expect(cleanState.lastOpenedTemplateFiles.length).to.equal(10);
                expect(cleanState.lastOpenedTemplateFiles[0]).to.eql(recentlyOpenedTemplate);
            });
        });
    });

    describe('actions', () => {
        describe(ACTION_SET_LAST_OPENED_SPLITS_FILES, () => {
            it(`it should call ${ID_MUTATION_SET_LAST_OPENED_SPLITS_FILES}`, async () => {
                const rootState = {
                    splitterino: {
                        meta: generateEmptyState()
                    }
                };

                const recentlyOpenedSplits: RecentlyOpenedSplit[] = [{
                    gameName: 'test',
                    category: 'foo',
                    path: '/path/to/file'
                }];

                const { commits, dispatches } = await testAction(
                    metaModule.actions[ID_ACTION_SET_LAST_OPENED_SPLITS_FILES],
                    { state: generateEmptyState(), rootState },
                    recentlyOpenedSplits
                );

                expect(commits).to.have.lengthOf(1);
                // tslint:disable-next-line:no-unused-expression
                expect(dispatches).to.be.empty;
                // tslint:disable-next-line:no-unused-expression
                expect(commits[0].payload).to.eql(recentlyOpenedSplits);
            });
        });

        describe(ACTION_ADD_OPENED_SPLITS_FILE, () => {
            it('should add game info to current splits file', async () => {
                const rootState = {
                    splitterino: {
                        meta: generateEmptyState(),
                        gameInfo: {
                            category: 'foo',
                            name: 'bar',
                            platform: 'foobar',
                            region: 'pal_eur'
                        }
                    }
                };

                const recentlyOpenedSplitPath = '/path/to/file';

                const { commits, dispatches } = await testAction(
                    metaModule.actions[ID_ACTION_ADD_OPENED_SPLITS_FILE],
                    { state: generateEmptyState(), rootState: rootState as RootState },
                    recentlyOpenedSplitPath
                );

                expect(commits).to.have.lengthOf(1);
                // tslint:disable-next-line:no-unused-expression
                expect(dispatches).to.be.empty;
                // tslint:disable-next-line:no-unused-expression
                expect(commits[0].payload).to.eql({
                    path: recentlyOpenedSplitPath,
                    category: 'foo',
                    gameName: 'bar',
                    platform: 'foobar',
                    region: 'pal_eur'
                });
            });
        });

        describe(ACTION_SET_LAST_OPENED_TEMPLATE_FILES, () => {
            it(`it should call ${ID_MUTATION_SET_LAST_OPENED_TEMPLATE_FILES}`, async () => {
                const rootState = {
                    splitterino: {
                        meta: generateEmptyState()
                    }
                };

                const recentlyOpenedTemplates: RecentlyOpenedTemplate[] = [{
                    name: 'test',
                    author: 'foo',
                    path: '/path/to/template'
                }];

                const { commits, dispatches } = await testAction(
                    metaModule.actions[ID_ACTION_SET_LAST_OPENED_TEMPLATE_FILES],
                    { state: generateEmptyState(), rootState },
                    recentlyOpenedTemplates
                );

                expect(commits).to.have.lengthOf(1);
                // tslint:disable-next-line:no-unused-expression
                expect(dispatches).to.be.empty;
                // tslint:disable-next-line:no-unused-expression
                expect(commits[0].payload).to.eql(recentlyOpenedTemplates);
            });
        });

        describe(ACTION_ADD_OPENED_TEMPLATE_FILE, () => {
            it(`it should call ${ID_MUTATION_ADD_OPENED_TEMPLATE_FILE}`, async () => {
                const rootState = {
                    splitterino: {
                        meta: generateEmptyState()
                    }
                };

                const recentlyOpenedTemplate: RecentlyOpenedTemplate = {
                    name: 'test',
                    author: 'foo',
                    path: '/path/to/template'
                };

                const { commits, dispatches } = await testAction(
                    metaModule.actions[ID_ACTION_ADD_OPENED_TEMPLATE_FILE],
                    { state: generateEmptyState(), rootState },
                    recentlyOpenedTemplate
                );

                expect(commits).to.have.lengthOf(1);
                // tslint:disable-next-line:no-unused-expression
                expect(dispatches).to.be.empty;
                // tslint:disable-next-line:no-unused-expression
                expect(commits[0].payload).to.eql(recentlyOpenedTemplate);
            });
        });
    });
});
