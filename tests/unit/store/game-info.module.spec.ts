/* eslint-disable no-unused-expressions,id-blacklist */
import { expect } from 'chai';

import { SplitsFile } from '../../../src/models/files';
import { GameInfo, Region, TimingMethod } from '../../../src/models/splits';
import { GameInfoState } from '../../../src/models/states/game-info.state';
import { Module } from '../../../src/models/store';
import {
    getGameInfoStoreModule,
    ID_HANDLER_APPLY_GAMEINFO,
    ID_HANDLER_APPLY_SPLITS_FILE,
    ID_HANDLER_SET_CATEGORY,
    ID_HANDLER_SET_GAME_NAME,
    ID_HANDLER_SET_LANGUAGE,
    ID_HANDLER_SET_PLATFORM,
    ID_HANDLER_SET_REGION,
} from '../../../src/store/modules/game-info.module';

describe('Game-Info Store-State', () => {
    const gameInfoModule: Module<GameInfoState> = getGameInfoStoreModule();

    it('should be a valid module', () => {
        expect(gameInfoModule).to.be.a('object');
        expect(gameInfoModule).to.have.property('handlers').which.is.a('object').and.has.keys;
        expect(gameInfoModule).to.have.property('initialize').which.is.a('function');

        const state = gameInfoModule.initialize();
        expect(state).to.be.a('object').and.to.have.keys;
    });

    describe('Handlers', () => {
        describe(ID_HANDLER_SET_GAME_NAME, () => {
            it('should set valid names', () => {
                const state = gameInfoModule.initialize();

                [
                    'test',
                    '',
                    'äöafr432v',
                    'ВКЪߖຕផ',
                ].forEach(value => {
                    const diff = gameInfoModule.handlers[ID_HANDLER_SET_GAME_NAME](state, value);
                    expect(diff).to.deep.equal({ name: value });
                });
            });

            it('should ignore invalid names', () => {
                const state = gameInfoModule.initialize();

                [
                    123,
                    -123,
                    [],
                    {},
                    NaN,
                    Infinity,
                    Symbol(),
                    /test/,
                    true,
                    false,
                    null,
                    undefined,
                ].forEach(value => {
                    const diff = gameInfoModule.handlers[ID_HANDLER_SET_GAME_NAME](state, value);
                    expect(diff).to.deep.equal({});
                });
            });
        });

        describe(ID_HANDLER_SET_CATEGORY, () => {
            it('should set valid categories', () => {
                const state = gameInfoModule.initialize();

                [
                    'test',
                    '',
                    'äöafr432v',
                    'ВКЪߖຕផ',
                    'any%'
                ].forEach(value => {
                    const diff = gameInfoModule.handlers[ID_HANDLER_SET_CATEGORY](state, value);
                    expect(diff).to.deep.equal({ category: value });
                });
            });

            it('should ignore invalid categories', () => {
                const state = gameInfoModule.initialize();

                [
                    123,
                    -123,
                    [],
                    {},
                    NaN,
                    Infinity,
                    Symbol(),
                    /test/,
                    true,
                    false,
                    null,
                    undefined,
                ].forEach(value => {
                    const diff = gameInfoModule.handlers[ID_HANDLER_SET_CATEGORY](state, value);
                    expect(diff).to.deep.equal({});
                });
            });
        });

        describe(ID_HANDLER_SET_LANGUAGE, () => {
            it('should set valid languages', () => {
                const state = gameInfoModule.initialize();

                [
                    'en',
                    'de',
                    'fr',
                    'ja',
                    'zh',
                    'fa',
                    'aa',
                ].forEach(value => {
                    const diff = gameInfoModule.handlers[ID_HANDLER_SET_LANGUAGE](state, value);
                    expect(diff).to.deep.equal({ language: value });
                });
            });

            it('should ignore invalid languages', () => {
                const state = gameInfoModule.initialize();

                [
                    'english',
                    'funny',
                    'zz',
                    'äh',
                    'ВК',
                    123,
                    -123,
                    [],
                    {},
                    NaN,
                    Infinity,
                    Symbol(),
                    /test/,
                    true,
                    false,
                    null,
                    undefined,
                ].forEach(value => {
                    const diff = gameInfoModule.handlers[ID_HANDLER_SET_LANGUAGE](state, value);
                    expect(diff).to.deep.equal({});
                });
            });
        });

        describe(ID_HANDLER_SET_PLATFORM, () => {
            it('should set valid platforms', () => {
                const state = gameInfoModule.initialize();

                [
                    'test',
                    '',
                    'äöafr432v',
                    'ВКЪߖຕផ',
                    'any%'
                ].forEach(value => {
                    const diff = gameInfoModule.handlers[ID_HANDLER_SET_PLATFORM](state, value);
                    expect(diff).to.deep.equal({ platform: value });
                });
            });

            it('should ignore invalid platforms', () => {
                const state = gameInfoModule.initialize();

                [
                    123,
                    -123,
                    [],
                    {},
                    NaN,
                    Infinity,
                    Symbol(),
                    /test/,
                    true,
                    false,
                    null,
                    undefined,
                ].forEach(value => {
                    const diff = gameInfoModule.handlers[ID_HANDLER_SET_PLATFORM](state, value);
                    expect(diff).to.deep.equal({});
                });
            });
        });

        describe(ID_HANDLER_SET_REGION, () => {
            it('should set valid platforms', () => {
                const state = gameInfoModule.initialize();

                [
                    Region.NTSC,
                    Region.NTSC_JPN,
                    Region.NTSC_USA,
                    Region.PAL,
                    Region.PAL_BRA,
                    Region.PAL_CHN,
                    Region.PAL_EUR,
                ].forEach(value => {
                    const diff = gameInfoModule.handlers[ID_HANDLER_SET_REGION](state, value);
                    expect(diff).to.deep.equal({ region: value });
                });
            });

            it('should ignore invalid platforms', () => {
                const state = gameInfoModule.initialize();

                [
                    'test',
                    '',
                    'äöafr432v',
                    'ВКЪߖຕផ',
                    'any%',
                    'ntsc',
                    'pal',
                    'buddy',
                    123,
                    -123,
                    [],
                    {},
                    NaN,
                    Infinity,
                    Symbol(),
                    /test/,
                    true,
                    false,
                    null,
                    undefined,
                ].forEach(value => {
                    const diff = gameInfoModule.handlers[ID_HANDLER_SET_REGION](state, value);
                    expect(diff).to.deep.equal({});
                });
            });
        });

        describe(ID_HANDLER_APPLY_SPLITS_FILE, () => {
            it('should set the game-info from the splits-file', () => {
                const state = gameInfoModule.initialize();
                const gameInfo: GameInfo = {
                    name: 'Super Mario 64',
                    category: '70 Stars',
                    language: 'ja',
                    platform: 'n64',
                    region: Region.NTSC_JPN,
                };
                const splitsFile: SplitsFile = {
                    splits: {
                        segments: [],
                        timing: TimingMethod.RTA,
                        game: gameInfo,
                    },
                    version: '1.0'
                };

                const diff = gameInfoModule.handlers[ID_HANDLER_APPLY_SPLITS_FILE](state, splitsFile);
                expect(diff).to.deep.equal(gameInfo);
            });
        });

        describe(ID_HANDLER_APPLY_GAMEINFO, () => {
            it('should set the game-info', () => {
                const state = gameInfoModule.initialize();
                const gameInfo: GameInfo = {
                    name: 'Super Mario 64',
                    category: '70 Stars',
                    language: 'ja',
                    platform: 'n64',
                    region: Region.NTSC_JPN,
                };

                const diff = gameInfoModule.handlers[ID_HANDLER_APPLY_GAMEINFO](state, gameInfo);
                expect(diff).to.deep.equal(gameInfo);
            });
        });
    });
});
