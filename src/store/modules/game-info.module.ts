import ISO6391 from 'iso-639-1';

import {
    ID_HANDLER_APPLY_GAME_INFO,
    ID_HANDLER_APPLY_GAME_INFO_SPLITS_FILE,
    ID_HANDLER_SET_GAME_INFO_CATEGORY,
    ID_HANDLER_SET_GAME_INFO_GAME_NAME,
    ID_HANDLER_SET_GAME_INFO_LANGUAGE,
    ID_HANDLER_SET_GAME_INFO_PLATFORM,
    ID_HANDLER_SET_GAME_INFO_REGION,
} from '../../common/constants';
import { SplitsFile } from '../../models/files';
import { Region } from '../../models/splits';
import { GameInfoState } from '../../models/states/game-info.state';
import { Module } from '../../models/store';

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
            [ID_HANDLER_SET_GAME_INFO_GAME_NAME](state: GameInfoState, name: string) {
                if (typeof name !== 'string') {
                    return {};
                }

                return { name };
            },
            [ID_HANDLER_SET_GAME_INFO_CATEGORY](state: GameInfoState, category: string) {
                if (typeof category !== 'string') {
                    return {};
                }

                return { category };
            },
            [ID_HANDLER_SET_GAME_INFO_LANGUAGE](state: GameInfoState, language: string) {
                if (!ISO6391.validate(language)) {
                    return {};
                }

                return { language };
            },
            [ID_HANDLER_SET_GAME_INFO_PLATFORM](state: GameInfoState, platform: string) {
                if (typeof platform !== 'string') {
                    return {};
                }

                return { platform };
            },
            [ID_HANDLER_SET_GAME_INFO_REGION](state: GameInfoState, region: Region) {
                if (!allRegions.includes(region)) {
                    return {};
                }

                return { region };
            },
            [ID_HANDLER_APPLY_GAME_INFO_SPLITS_FILE](state: GameInfoState, splitsFile: SplitsFile) {
                return splitsFile.splits.game;
            },
            [ID_HANDLER_APPLY_GAME_INFO](state: GameInfoState, gameInfo: GameInfoState) {
                return gameInfo;
            }
        },
    };
}
