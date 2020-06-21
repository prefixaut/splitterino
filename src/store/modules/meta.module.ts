import {
    ID_HANDLER_ADD_META_OPENED_SPLITS_FILE,
    ID_HANDLER_ADD_META_OPENED_TEMPLATE_FILE,
    ID_HANDLER_SET_META_LAST_OPENED_SPLITS_FILES,
    ID_HANDLER_SET_META_LAST_OPENED_TEMPLATE_FILES,
} from '../../common/constants';
import { MetaState, RecentlyOpenedSplit, RecentlyOpenedTemplate } from '../../models/states/meta.state';
import { Module } from '../../models/store';

export function getMetaStoreModule(): Module<MetaState> {
    return {
        initialize() {
            return {
                lastOpenedSplitsFiles: [],
                lastOpenedTemplateFiles: []
            };
        },
        handlers: {
            [ID_HANDLER_SET_META_LAST_OPENED_SPLITS_FILES](
                state: MetaState,
                lastOpenedSplitsFiles: RecentlyOpenedSplit[]
            ) {
                return { lastOpenedSplitsFiles: lastOpenedSplitsFiles };
            },
            [ID_HANDLER_ADD_META_OPENED_SPLITS_FILE](state: MetaState, splitsFile: RecentlyOpenedSplit) {
                let newSplitFiles = state.lastOpenedSplitsFiles.filter(file => file.path !== splitsFile.path);
                newSplitFiles.unshift(splitsFile);

                if (newSplitFiles.length > 10) {
                    newSplitFiles = newSplitFiles.slice(0, 10);
                }

                return { lastOpenedSplitsFiles: newSplitFiles };
            },
            [ID_HANDLER_SET_META_LAST_OPENED_TEMPLATE_FILES](
                state: MetaState,
                lastOpenedTemplateFiles: RecentlyOpenedTemplate[]
            ) {
                return { lastOpenedTemplateFiles: lastOpenedTemplateFiles };
            },
            [ID_HANDLER_ADD_META_OPENED_TEMPLATE_FILE](state: MetaState, templateFile: RecentlyOpenedTemplate) {
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
