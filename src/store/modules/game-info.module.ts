import ISO6391 from 'iso-639-1';
import { ActionContext, Module } from 'vuex';

import { GameInfoState, Region } from '../../models/states/game-info.state';
import { RootState } from '../../models/states/root.state';

export const MODULE_PATH = 'splitterino/gameInfo';

export const ID_MUTATION_SET_GAME_NAME = 'setGameName';
export const ID_MUTATION_SET_CATEGORY = 'setCategory';
export const ID_MUTATION_SET_LANGUAGE = 'setLanguage';
export const ID_MUTATION_SET_PLATFORM = 'setPlatform';
export const ID_MUTATION_SET_REGION = 'setRegion';

export const ID_ACTION_SET_GAME_NAME = 'setGameName';
export const ID_ACTION_SET_CATEGORY = 'setCategory';
export const ID_ACTION_SET_LANGUAGE = 'setLanguage';
export const ID_ACTION_SET_PLATFORM = 'setPlatform';
export const ID_ACTION_SET_REGION = 'setRegion';

export const MUTATION_SET_GAME_NAME = `${MODULE_PATH}/${ID_MUTATION_SET_GAME_NAME}`;
export const MUTATION_SET_CATEGORY = `${MODULE_PATH}/${ID_MUTATION_SET_CATEGORY}`;
export const MUTATION_SET_LANGUAGE = `${MODULE_PATH}/${ID_MUTATION_SET_LANGUAGE}`;
export const MUTATION_SET_PLATFORM = `${MODULE_PATH}/${ID_MUTATION_SET_PLATFORM}`;
export const MUTATION_SET_REGION = `${MODULE_PATH}/${ID_MUTATION_SET_REGION}`;

export const ACTION_SET_GAME_NAME = `${MODULE_PATH}/${ID_ACTION_SET_GAME_NAME}`;
export const ACTION_SET_CATEGORY = `${MODULE_PATH}/${ID_ACTION_SET_CATEGORY}`;
export const ACTION_SET_LANGUAGE = `${MODULE_PATH}/${ID_ACTION_SET_LANGUAGE}`;
export const ACTION_SET_PLATFORM = `${MODULE_PATH}/${ID_ACTION_SET_PLATFORM}`;
export const ACTION_SET_REGION = `${MODULE_PATH}/${ID_ACTION_SET_REGION}`;

const allRegions: Region[] = [
    Region.NTSC,
    Region.NTSC_JPN,
    Region.NTSC_USA,
    Region.PAL,
    Region.PAL_BRA,
    Region.PAL_CHN,
    Region.PAL_EUR,
];

export function getGameInfoStoreModule(): Module<GameInfoState, RootState> {
    return {
        namespaced: true,
        state: {
            name: null,
            category: null,
            language: null,
            platform: null,
            region: null,
        },
        getters: {},
        mutations: {
            [ID_MUTATION_SET_GAME_NAME](state: GameInfoState, name: string) {
                if (typeof name !== 'string') {
                    return;
                }

                state.name = name;
            },
            [ID_MUTATION_SET_CATEGORY](state: GameInfoState, category: string) {
                if (typeof category !== 'string') {
                    return;
                }

                state.category = category;
            },
            [ID_MUTATION_SET_LANGUAGE](state: GameInfoState, language: string) {
                if (!ISO6391.validate(language)) {
                    return;
                }

                state.language = language;
            },
            [ID_MUTATION_SET_PLATFORM](state: GameInfoState, platform: string) {
                if (typeof platform !== 'string') {
                    return;
                }

                state.platform = platform;
            },
            [ID_MUTATION_SET_REGION](state: GameInfoState, region: Region) {
                if (!allRegions.includes(region)) {
                    return;
                }

                state.region = region;
            },
        },
        actions: {
            async [ID_ACTION_SET_GAME_NAME](context: ActionContext<GameInfoState, RootState>, name: string) {
                if (typeof name !== 'string') {
                    return false;
                }

                context.commit(ID_MUTATION_SET_GAME_NAME, name);

                return true;
            },
            async [ID_ACTION_SET_CATEGORY](context: ActionContext<GameInfoState, RootState>, category: string) {
                if (typeof category !== 'string') {
                    return false;
                }

                context.commit(ID_MUTATION_SET_CATEGORY, category);

                return true;
            },
            async [ID_ACTION_SET_LANGUAGE](context: ActionContext<GameInfoState, RootState>, language: string) {
                if (!ISO6391.validate(language)) {
                    return false;
                }

                context.commit(ID_MUTATION_SET_LANGUAGE, language);

                return true;
            },
            async [ID_ACTION_SET_PLATFORM](context: ActionContext<GameInfoState, RootState>, platform: string) {
                if (typeof platform !== 'string') {
                    return false;
                }

                context.commit(ID_MUTATION_SET_PLATFORM, platform);

                return true;
            },
            async [ID_ACTION_SET_REGION](context: ActionContext<GameInfoState, RootState>, region: Region) {
                if (!allRegions.includes(region)) {
                    return false;
                }

                context.commit(ID_MUTATION_SET_REGION, region);

                return true;
            },
        },
    };
}
