/* eslint-disable no-unused-expressions */
import { expect } from 'chai';

import { MetaState, RecentlyOpenedSplit, RecentlyOpenedTemplate } from '../../../src/models/states/meta.state';
import {
    getMetaStoreModule,
    ID_HANDLER_ADD_OPENED_SPLITS_FILE,
    ID_HANDLER_ADD_OPENED_TEMPLATE_FILE,
    ID_HANDLER_SET_LAST_OPENED_SPLITS_FILES,
    ID_HANDLER_SET_LAST_OPENED_TEMPLATE_FILES,
} from '../../../src/store/modules/meta.module';

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

describe('Meta Store-Module', () => {
    const metaModule = getMetaStoreModule();

    it('should be a valid module', () => {
        expect(metaModule).to.be.a('object');
        expect(metaModule).to.have.property('handlers').which.is.a('object').and.has.keys;
        expect(metaModule).to.have.property('initialize').which.is.a('function');

        const state = metaModule.initialize();
        expect(state).to.be.a('object').and.to.have.keys;
    });

    describe('Handlers', () => {
        describe(ID_HANDLER_SET_LAST_OPENED_SPLITS_FILES, () => {
            it('should set the last opened splits files', () => {
                const state = metaModule.initialize();
                const recentlyOpenedSplits: RecentlyOpenedSplit[] = [{
                    gameName: 'test',
                    category: 'foo',
                    path: '/path/to/file'
                }];
                const diff = metaModule.handlers[ID_HANDLER_SET_LAST_OPENED_SPLITS_FILES](state, recentlyOpenedSplits);
                expect(diff.lastOpenedSplitsFiles).to.deep.equal(recentlyOpenedSplits);
            });
        });

        describe(ID_HANDLER_ADD_OPENED_SPLITS_FILE, () => {
            it('should add a splits file to recently opened ones', () => {
                const recentlyOpenedSplit: RecentlyOpenedSplit = {
                    gameName: 'test',
                    category: 'foo',
                    path: '/path/to/file'
                };
                const state = metaModule.initialize();
                const diff = metaModule.handlers[ID_HANDLER_ADD_OPENED_SPLITS_FILE](
                    state,
                    recentlyOpenedSplit
                );
                expect(diff.lastOpenedSplitsFiles[0]).to.deep.equal(recentlyOpenedSplit);
            });

            it('should push a split to first place if its already in array', () => {
                const recentlyOpenedSplit: RecentlyOpenedSplit = {
                    gameName: 'test',
                    category: 'foo',
                    path: '/path/to/file'
                };
                const newSplitFile: RecentlyOpenedSplit = {
                    gameName: 'foobar',
                    category: 'bar',
                    path: '/some/path'
                };
                const state: MetaState = {
                    lastOpenedSplitsFiles: [
                        newSplitFile,
                        recentlyOpenedSplit
                    ],
                    lastOpenedTemplateFiles: [],
                };
                const diff = metaModule.handlers[ID_HANDLER_ADD_OPENED_SPLITS_FILE](
                    state,
                    recentlyOpenedSplit
                );
                expect(diff.lastOpenedSplitsFiles).to.deep.equal([
                    recentlyOpenedSplit,
                    newSplitFile
                ]);
            });

            it('should remove the last split file if the array length is > 10', () => {
                const recentlyOpenedSplit: RecentlyOpenedSplit = {
                    gameName: 'test',
                    category: 'foo',
                    path: '/path/to/file'
                };
                const state: MetaState = {
                    lastOpenedSplitsFiles: generateRandomSplitFileEntries(),
                    lastOpenedTemplateFiles: [],
                };
                const diff = metaModule.handlers[ID_HANDLER_ADD_OPENED_SPLITS_FILE](
                    state,
                    recentlyOpenedSplit
                );
                expect(diff.lastOpenedSplitsFiles.length).to.equal(10);
                expect(diff.lastOpenedSplitsFiles[0]).to.deep.equal(recentlyOpenedSplit);
            });
        });

        describe(ID_HANDLER_SET_LAST_OPENED_TEMPLATE_FILES, () => {
            it('should set the last opened template files', () => {
                const recentlyOpenedTemplates: RecentlyOpenedTemplate[] = [{
                    name: 'test',
                    author: 'foo',
                    path: '/path/to/template'
                }];
                const state = metaModule.initialize();
                const diff = metaModule.handlers[ID_HANDLER_SET_LAST_OPENED_TEMPLATE_FILES](
                    state,
                    recentlyOpenedTemplates
                );
                expect(diff.lastOpenedTemplateFiles).to.deep.equal(recentlyOpenedTemplates);
            });
        });

        describe(ID_HANDLER_ADD_OPENED_TEMPLATE_FILE, () => {
            it('should add a template file to recently opened ones', () => {
                const recentlyOpenedTemplate: RecentlyOpenedTemplate = {
                    name: 'test',
                    author: 'foo',
                    path: '/path/to/template'
                };
                const state = metaModule.initialize();
                const diff = metaModule.handlers[ID_HANDLER_ADD_OPENED_TEMPLATE_FILE](
                    state,
                    recentlyOpenedTemplate
                );
                expect(diff.lastOpenedTemplateFiles[0]).to.deep.equal(recentlyOpenedTemplate);
            });

            it('should push a split to first place if its already in array', () => {
                const recentlyOpenedTemplate: RecentlyOpenedTemplate = {
                    name: 'test',
                    author: 'foo',
                    path: '/path/to/template'
                };
                const newTemplateFile: RecentlyOpenedTemplate = {
                    name: 'foobar',
                    author: 'bar',
                    path: '/some/path'
                };
                const state: MetaState = {
                    lastOpenedSplitsFiles: [],
                    lastOpenedTemplateFiles: [
                        newTemplateFile,
                        recentlyOpenedTemplate
                    ],
                };
                const diff = metaModule.handlers[ID_HANDLER_ADD_OPENED_TEMPLATE_FILE](
                    state,
                    recentlyOpenedTemplate
                );
                expect(diff.lastOpenedTemplateFiles).to.deep.equal([
                    recentlyOpenedTemplate,
                    newTemplateFile
                ]);
            });

            it('should remove the last split file if the array length is > 10', () => {
                const recentlyOpenedTemplate: RecentlyOpenedTemplate = {
                    name: 'test',
                    author: 'foo',
                    path: '/path/to/template'
                };
                const state: MetaState = {
                    lastOpenedSplitsFiles: [],
                    lastOpenedTemplateFiles: generateRandomTemplateFileEntries(),
                };
                const diff = metaModule.handlers[ID_HANDLER_ADD_OPENED_TEMPLATE_FILE](
                    state,
                    recentlyOpenedTemplate
                );
                expect(diff.lastOpenedTemplateFiles.length).to.equal(10);
                expect(diff.lastOpenedTemplateFiles[0]).to.deep.equal(recentlyOpenedTemplate);
            });
        });
    });
});
