import { MetaState, RecentlyOpenedSplit, RecentlyOpenedTemplate } from '../../models/states/meta.state';
import { Module } from '../../models/store';

const MODULE_PATH = 'splitterino/meta';

export const ID_HANDLER_SET_LAST_OPENED_SPLITS_FILES = 'setLastOpenedSplitsFiles';
export const ID_HANDLER_ADD_OPENED_SPLITS_FILE = 'addOpenedSplitsFile';
export const ID_HANDLER_SET_LAST_OPENED_TEMPLATE_FILES = 'setLastOpenedTemplateFiles';
export const ID_HANDLER_ADD_OPENED_TEMPLATE_FILE = 'addOpenedTemplateFile';

export const HANDLER_SET_LAST_OPENED_SPLITS_FILES = `${MODULE_PATH}/${ID_HANDLER_SET_LAST_OPENED_SPLITS_FILES}`;
export const HANDLER_ADD_OPENED_SPLITS_FILE = `${MODULE_PATH}/${ID_HANDLER_ADD_OPENED_SPLITS_FILE}`;
export const HANDLER_SET_LAST_OPENED_TEMPLATE_FILES = `${MODULE_PATH}/${ID_HANDLER_SET_LAST_OPENED_TEMPLATE_FILES}`;
export const HANDLER_ADD_OPENED_TEMPLATE_FILE = `${MODULE_PATH}/${ID_HANDLER_ADD_OPENED_TEMPLATE_FILE}`;

export function getMetaStoreModule(): Module<MetaState> {
    return {
        initialize() {
            return {
                lastOpenedSplitsFiles: [],
                lastOpenedTemplateFiles: []
            };
        },
        handlers: {
            [ID_HANDLER_SET_LAST_OPENED_SPLITS_FILES](state: MetaState, lastOpenedSplitsFiles: RecentlyOpenedSplit[]) {
                return { lastOpenedSplitsFiles: lastOpenedSplitsFiles };
            },
            [ID_HANDLER_ADD_OPENED_SPLITS_FILE](state: MetaState, splitsFile: RecentlyOpenedSplit) {
                let newSplitFiles = state.lastOpenedSplitsFiles.filter(file => file.path !== splitsFile.path);
                newSplitFiles.unshift(splitsFile);

                if (newSplitFiles.length > 10) {
                    newSplitFiles = newSplitFiles.slice(0, 10);
                }

                return { lastOpenedSplitsFiles: newSplitFiles };
            },
            [ID_HANDLER_SET_LAST_OPENED_TEMPLATE_FILES](
                state: MetaState,
                lastOpenedTemplateFiles: RecentlyOpenedTemplate[]
            ) {
                return { lastOpenedTemplateFiles: lastOpenedTemplateFiles };
            },
            [ID_HANDLER_ADD_OPENED_TEMPLATE_FILE](state: MetaState, templateFile: RecentlyOpenedTemplate) {
                let newTemplateFiles = state.lastOpenedTemplateFiles.filter(file => file.path !== templateFile.path);
                newTemplateFiles.unshift(templateFile);

                if (newTemplateFiles.length > 10) {
                    newTemplateFiles = newTemplateFiles.slice(0, 10);
                }

                return { lastOpenedTemplateFiles: newTemplateFiles };
            },
        },
    };
}
