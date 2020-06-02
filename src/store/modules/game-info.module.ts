import ISO6391 from 'iso-639-1';

import { SplitsFile } from '../../models/files';
import { Region } from '../../models/splits';
import { GameInfoState } from '../../models/states/game-info.state';
import { Module } from '../../models/store';

export const MODULE_PATH = 'splitterino/gameInfo';

export const ID_HANDLER_SET_GAME_NAME = 'setGameName';
export const ID_HANDLER_SET_CATEGORY = 'setCategory';
export const ID_HANDLER_SET_LANGUAGE = 'setLanguage';
export const ID_HANDLER_SET_PLATFORM = 'setPlatform';
export const ID_HANDLER_SET_REGION = 'setRegion';
export const ID_HANDLER_APPLY_SPLITS_FILE = 'applySplitsFile';
export const ID_HANDLER_APPLY_GAMEINFO = 'applyGameInfo';

export const HANDLER_SET_GAME_NAME = `${MODULE_PATH}/${ID_HANDLER_SET_GAME_NAME}`;
export const HANDLER_SET_CATEGORY = `${MODULE_PATH}/${ID_HANDLER_SET_CATEGORY}`;
export const HANDLER_SET_LANGUAGE = `${MODULE_PATH}/${ID_HANDLER_SET_LANGUAGE}`;
export const HANDLER_SET_PLATFORM = `${MODULE_PATH}/${ID_HANDLER_SET_PLATFORM}`;
export const HANDLER_SET_REGION = `${MODULE_PATH}/${ID_HANDLER_SET_REGION}`;
export const HANDLER_APPLY_SPLITS_FILE = `${MODULE_PATH}/${ID_HANDLER_APPLY_SPLITS_FILE}`;
export const HANDLER_APPLY_GAMEINFO = `${MODULE_PATH}/${ID_HANDLER_APPLY_GAMEINFO}`;

const allRegions: Region[] = [
    Region.NTSC,
    Region.NTSC_JPN,
    Region.NTSC_USA,
    Region.PAL,
    Region.PAL_BRA,
    Region.PAL_CHN,
    Region.PAL_EUR,
];

export function getGameInfoStoreModule(): Module<GameInfoState> {
    return {
        initialize() {
            return {
                name: null,
                category: null,
                language: null,
                platform: null,
                region: null,
            };
        },
        handlers: {
            [ID_HANDLER_SET_GAME_NAME](state: GameInfoState, name: string) {
                if (typeof name !== 'string') {
                    return {};
                }

                return { name };
            },
            [ID_HANDLER_SET_CATEGORY](state: GameInfoState, category: string) {
                if (typeof category !== 'string') {
                    return {};
                }

                return { category };
            },
            [ID_HANDLER_SET_LANGUAGE](state: GameInfoState, language: string) {
                if (!ISO6391.validate(language)) {
                    return {};
                }

                return { language };
            },
            [ID_HANDLER_SET_PLATFORM](state: GameInfoState, platform: string) {
                if (typeof platform !== 'string') {
                    return {};
                }

                return { platform };
            },
            [ID_HANDLER_SET_REGION](state: GameInfoState, region: Region) {
                if (!allRegions.includes(region)) {
                    return {};
                }

                return { region };
            },
            [ID_HANDLER_APPLY_SPLITS_FILE](state: GameInfoState, splitsFile: SplitsFile) {
                return splitsFile.splits.game;
            },
            [ID_HANDLER_APPLY_GAMEINFO](state: GameInfoState, gameInfo: GameInfoState) {
                return gameInfo;
            }
        },
    };
}
