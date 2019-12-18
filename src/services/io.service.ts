import { BrowserWindow, FileFilter } from 'electron';
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import gunzip from 'gunzip-maybe';
import { Inject, Injectable, InjectionToken } from 'lightweight-di';
import { cloneDeep, merge, set } from 'lodash';
import { dirname, join } from 'path';
import { extract } from 'tar-stream';
import { Store } from 'vuex';

import { DEFAULT_APPLICATION_SETTINGS } from '../common/constants';
import { ApplicationSettings } from '../models/application-settings';
import { ELECTRON_INTERFACE_TOKEN, ElectronInterface } from '../models/electron';
import { TimingMethod } from '../models/segment';
import { MOST_RECENT_SPLITS_VERSION, SplitsFile } from '../models/splits-file';
import { GameInfoState } from '../models/states/game-info.state';
import { RecentlyOpenedSplit, RecentlyOpenedTemplate } from '../models/states/meta.state';
import { RootState } from '../models/states/root.state';
import { Settings } from '../models/states/settings.state';
import { TemplateFiles } from '../models/template-files';
import { VALIDATOR_SERVICE_TOKEN, ValidatorService } from '../services/validator.service';
import {
    ACTION_SET_CATEGORY,
    ACTION_SET_GAME_NAME,
    ACTION_SET_LANGUAGE,
    ACTION_SET_PLATFORM,
    ACTION_SET_REGION,
} from '../store/modules/game-info.module';
import {
    ACTION_ADD_OPENED_SPLITS_FILE,
    ACTION_ADD_OPENED_TEMPLATE_FILE,
    ACTION_SET_LAST_OPENED_SPLITS_FILES,
    ACTION_SET_LAST_OPENED_TEMPLATE_FILES,
} from '../store/modules/meta.module';
import { ACTION_SET_ALL_SETTINGS } from '../store/modules/settings.module';
import { ACTION_SET_ALL_SEGMENTS, ACTION_SET_TIMING } from '../store/modules/splits.module';
import { asSaveableSegment } from '../utils/converters';
import { isDevelopment } from '../utils/is-development';
import { Logger } from '../utils/logger';
import { TRANSFORMER_SERVICE_TOKEN, TransformerService } from './transfromer.service';

export const IO_SERVICE_TOKEN = new InjectionToken<IOService>('io');

@Injectable
export class IOService {
    constructor(
        @Inject(ELECTRON_INTERFACE_TOKEN) protected electron: ElectronInterface,
        @Inject(VALIDATOR_SERVICE_TOKEN) protected validator: ValidatorService,
        @Inject(TRANSFORMER_SERVICE_TOKEN) protected transformer: TransformerService,
    ) {
        this.assetDir = join(this.electron.getAppPath(), isDevelopment() ? 'resources' : '..');
    }

    protected readonly assetDir;
    protected readonly appSettingsFileName = 'application-settings.json';
    protected readonly settingsFileName = 'settings.json';

    public static readonly SPLITS_FILE_FILTER: FileFilter = {
        name: 'Splitterino-Splits',
        extensions: ['splits'],
    };

    public static readonly TEMPLATE_FILE_FILTER: FileFilter = {
        name: 'Splitterino-Template',
        extensions: ['psplt']
    };

    public getAssetDirectory() {
        return this.assetDir;
    }

    public loadFile(path: string, basePath: string = this.assetDir): string | null {
        const filePath = join(basePath, path);
        Logger.debug({
            msg: 'Attempting to load file',
            file: filePath,
        });

        let content: string = null;
        try {
            content = readFileSync(filePath, { encoding: 'utf8' });
        } catch (e) {
            Logger.warn({
                msg: 'Could not load file',
                file: filePath,
                error: e,
            });
        }

        return content;
    }

    public saveFile(path: string, data: string, basePath: string = this.assetDir): boolean {
        const filePath = join(basePath, path);

        Logger.trace({
            msg: 'Attempting to save to file',
            file: filePath,
        });

        try {
            mkdirSync(dirname(filePath), { recursive: true });
        } catch (e) {
            if (e.code !== 'EEXIST') {
                Logger.error({
                    msg: 'Error while creating directory structure',
                    directory: dirname(filePath),
                    error: e,
                });

                return false;
            }
        }

        try {
            writeFileSync(filePath, data, { encoding: 'utf8' });
        } catch (e) {
            Logger.error({
                msg: 'Error while writing file',
                file: filePath,
                error: e,
            });

            return false;
        }

        return true;
    }

    public loadJSONFromFile(path: string, basePath: string = this.assetDir): any {
        let loadedFile: string;
        try {
            loadedFile = this.loadFile(path, basePath);

            return JSON.parse(loadedFile);
        } catch (e) {
            Logger.warn({
                msg: 'Could not parse JSON from file',
                string: loadedFile,
                error: e,
            });
        }

        return null;
    }

    public saveJSONToFile(path: string, data: object, basePath: string = this.assetDir): boolean {
        return this.saveFile(path, JSON.stringify(data, null, 4), basePath);
    }

    /**
     * Attempts to load splits from a File to the store.
     * When no File is specified, it's asking the user to select a splits-file.
     *
     * @param file Optional. The splits-file which should be loaded into the store.
     *
     * @returns A Promise which resolves to if the file was successfully loaded into store.
     */
    public loadSplitsFromFileToStore(store: Store<RootState>, file?: string): Promise<boolean> {
        let fileSelect: Promise<string>;

        if (file != null) {
            Logger.debug({
                msg: 'Loading splits from provided File',
                file,
            });
            fileSelect = Promise.resolve(file);
        } else {
            fileSelect = this.askUserToOpenSplitsFile();
        }

        return fileSelect
            .then(async filePath => {
                if (filePath == null) {
                    Logger.debug('No files selected, skipping loading');

                    return false;
                }

                Logger.debug({
                    msg: 'Loading splits from File',
                    file: filePath,
                });
                const loadedJSON: any = this.loadJSONFromFile(filePath, '');
                let loadedSplits: SplitsFile;

                if (loadedJSON != null && typeof loadedJSON === 'object') {
                    loadedSplits = this.transformer.upgradeSplitsFile(loadedJSON, loadedJSON.version);
                }

                if (loadedSplits == null || !this.validator.isSplits(loadedSplits.splits)) {
                    Logger.error({
                        msg: 'The loaded splits are not valid Splits!',
                        file: filePath,
                    });

                    return false;
                }

                const defaultGameInfo: GameInfoState = {
                    name: null,
                    category: null,
                    language: null,
                    platform: null,
                    region: null,
                };

                if (loadedSplits.splits.game == null) {
                    loadedSplits.splits.game = defaultGameInfo;
                } else {
                    loadedSplits.splits.game = {
                        ...defaultGameInfo,
                        ...loadedSplits.splits.game,
                    };
                }

                Logger.debug('Loaded splits are valid! Applying to store ...');

                const values = await Promise.all([
                    store.dispatch(ACTION_SET_ALL_SEGMENTS, loadedSplits.splits.segments),
                    store.dispatch(ACTION_SET_TIMING, loadedSplits.splits.timing),
                    store.dispatch(ACTION_SET_GAME_NAME, loadedSplits.splits.game.name),
                    store.dispatch(ACTION_SET_CATEGORY, loadedSplits.splits.game.category),
                    store.dispatch(ACTION_SET_LANGUAGE, loadedSplits.splits.game.language),
                    store.dispatch(ACTION_SET_PLATFORM, loadedSplits.splits.game.platform),
                    store.dispatch(ACTION_SET_REGION, loadedSplits.splits.game.region),
                ]);

                await store.dispatch(ACTION_ADD_OPENED_SPLITS_FILE, filePath);

                return values[0];
            })
            .catch(error => {
                Logger.error({
                    msg: 'Error while loading splits',
                    error,
                    errorMessage: error.message,
                });

                // Rethrow the error to be processed
                throw error;
            });
    }

    /**
     * Saves the splits from the store into a file.
     *
     * @param store The Store-Instance to get the data from
     * @param file The File where the splits should be saved to. When left empty, it'll prompt the user to pick a file.
     * @param window The window to use as parent. Defaults to the main window.
     */
    public saveSplitsFromStoreToFile(store: Store<RootState>, file?: string, window?: BrowserWindow): Promise<boolean> {
        let fileSelect: Promise<string>;
        if (file != null) {
            Logger.debug({
                msg: 'Saving splits to provided File',
                file,
            });
            fileSelect = Promise.resolve(file);
        } else {
            fileSelect = this.askUserToSaveSplitsFile(window);
        }

        return fileSelect.then(fileToSave => {
            if (fileToSave == null) {
                Logger.debug('The file to which should be saved to, is null, skipping saving');

                return false;
            }

            Logger.debug({
                msg: 'Saving Splits to the File',
                file: fileToSave,
            });

            const gameInfo = store.state.splitterino.gameInfo;
            Object.keys(gameInfo).forEach(key => {
                if (gameInfo[key] == null) {
                    delete gameInfo[key];
                }
            });

            const fileContent: SplitsFile = {
                version: MOST_RECENT_SPLITS_VERSION,
                splits: {
                    segments: cloneDeep(store.state.splitterino.splits.segments).map(segment =>
                        asSaveableSegment(segment)
                    ),
                    timing: store.state.splitterino.splits.timing || TimingMethod.RTA,
                    game: gameInfo,
                },
            };

            return this.saveJSONToFile(fileToSave, fileContent, '');
        });
    }

    /**
     * Opens a File-Browser to select a single splits-file.
     *
     * @returns A Promise which resolves to the path of the splits-file.
     */
    public askUserToOpenSplitsFile(): Promise<string> {
        Logger.debug('Asking user to select a Splits-File ...');

        return this.electron
            .showOpenDialog(this.electron.getCurrentWindow(), {
                title: 'Load Splits',
                filters: [IOService.SPLITS_FILE_FILTER],
                properties: ['openFile'],
            })
            .then(filePaths => {
                let singlePath: string;
                if (Array.isArray(filePaths)) {
                    singlePath = filePaths.length === 0 ? null : filePaths[0];
                } else {
                    singlePath = null;
                }

                Logger.debug({
                    msg: 'User has selected Splits-File',
                    file: singlePath,
                });

                return singlePath;
            });
    }

    public async loadTemplateFile(store: Store<RootState>, file?: string): Promise<TemplateFiles | null> {
        // Get last opened template file from store if no file was given
        if (file == null && store.state.splitterino.meta.lastOpenedTemplateFiles.length > 0) {
            Logger.debug('Using last opened template file');
            file = store.state.splitterino.meta.lastOpenedTemplateFiles[0].path;
        }

        if (file != null) {
            Logger.debug({
                msg: 'Loading template from file',
                file: file
            });

            return new Promise(resolve => {
                // File contents go here
                const templateFiles: TemplateFiles = {};
                // List of files accepted
                const acceptedFiles: string[] = ['meta.json', 'template.html', 'styles.css'];
                const readStream = createReadStream(file);

                readStream.on('open', () => {
                    // Create extractor
                    const extractor = extract();
                    extractor.on('entry', (header, stream, next) => {
                        let data = '';

                        // Append chunks to data
                        stream.on('data', chunk => {
                            data += chunk;
                            stream.resume();
                        });

                        // Check for error and close readStream
                        stream.on('error', () => {
                            Logger.error({
                                msg: 'Error occured while extracting files from template archive',
                                file: file
                            });

                            readStream.close();
                        });

                        // Check if file is accepted and handle correctly
                        // Move to next file
                        stream.on('end', () => {
                            if (acceptedFiles.includes(header.name)) {
                                if (header.name === 'meta.json') {
                                    try {
                                        templateFiles[header.name.split('.')[0]] = JSON.parse(data);
                                    } catch (error) {
                                        Logger.error({
                                            msg: 'Could not parse meta file to JSON'
                                        });

                                        readStream.close();
                                        resolve(null);

                                        return;
                                    }
                                } else {
                                    templateFiles[header.name.split('.')[0]] = data;
                                }
                            }
                            next();
                        });
                    });

                    // Close stream when extraction finished
                    extractor.on('finish', () => {
                        readStream.close();

                        const requiredFiles = acceptedFiles.map(f => f.split('.')[0]);
                        const loadedFiles = Object.keys(templateFiles);
                        for (const requiredFile of requiredFiles) {
                            if (!loadedFiles.includes(requiredFile)) {
                                Logger.error({
                                    msg: 'Missing required file in template',
                                    missingFile: requiredFile
                                });

                                resolve(null);

                                return;
                            }

                            if (requiredFile === 'meta') {
                                if (!this.validator.isTemplateMetaFile(templateFiles.meta)) {
                                    Logger.error({
                                        msg: 'Meta file is not valid'
                                    });

                                    resolve(null);

                                    return;
                                }
                            }
                        }

                        store.dispatch(ACTION_ADD_OPENED_TEMPLATE_FILE, {
                            path: file,
                            author: templateFiles.meta.author,
                            name: templateFiles.meta.name
                        });
                        resolve(templateFiles);
                    });

                    // Try to unzip template file if it is zipped
                    // Extract files from tar archive
                    readStream.pipe(gunzip()).pipe(extractor);
                });

                readStream.on('error', error => {
                    Logger.error({
                        msg: 'Unable to create readstream for template',
                        file: file
                    });

                    readStream.close();
                    resolve(null);
                });
            });
        }

        return null;
    }

    /**
     * Opens a File-Browser to select a single template-file.
     *
     * @returns A Promise which resolves to the path of the template-file.
     */
    public async askUserToOpenTemplateFile(): Promise<boolean> {
        Logger.debug('Asking user to select a Template-File ...');

        return this.electron
            .showOpenDialog(this.electron.getCurrentWindow(), {
                title: 'Load Template',
                filters: [IOService.TEMPLATE_FILE_FILTER],
                properties: ['openFile'],
            })
            .then(filePaths => {
                let singlePath: string;
                if (!Array.isArray(filePaths)) {
                    return false;
                }

                singlePath = filePaths.length === 0 ? null : filePaths[0];

                Logger.debug({
                    msg: 'User has selected Template-File',
                    file: singlePath,
                });

                this.electron.broadcastEvent('load-template', singlePath);

                return true;
            });
    }

    /**
     * Helper function to ask the user to where the splits should be saved to.
     *
     * @param window The window which should be used as parent window. Default to main window.
     */
    public askUserToSaveSplitsFile(window?: BrowserWindow): Promise<string> {
        return this.electron.showSaveDialog(window || this.electron.getCurrentWindow(), {
            title: 'Save Splits',
            filters: [IOService.SPLITS_FILE_FILTER],
        });
    }

    /**
     * Loads application settings object from file if it exists
     * @param store Vuex store instance
     */
    public async loadApplicationSettingsFromFile(
        store: Store<RootState>,
        splitsFile?: string
    ): Promise<ApplicationSettings> {
        const appSettings = this.loadJSONFromFile(this.appSettingsFileName);

        try {
            if (splitsFile != null && typeof splitsFile === 'string') {
                await this.loadSplitsFromFileToStore(store, splitsFile);
            } else if (this.validator.isApplicationSettings(appSettings)) {
                let lastOpenedSplitsFiles: RecentlyOpenedSplit[] = [];
                if (appSettings.lastOpenedSplitsFiles != null) {
                    lastOpenedSplitsFiles = appSettings.lastOpenedSplitsFiles.filter(recentSplit =>
                        existsSync(recentSplit.path)
                    );

                    if (lastOpenedSplitsFiles.length > 0) {
                        await store.dispatch(ACTION_SET_LAST_OPENED_SPLITS_FILES, lastOpenedSplitsFiles);
                        await this.loadSplitsFromFileToStore(store, lastOpenedSplitsFiles[0].path);
                    }
                }

                let lastOpenedTemplateFiles: RecentlyOpenedTemplate[] = [];
                if (appSettings.lastOpenedTemplateFiles != null) {
                    lastOpenedTemplateFiles = appSettings.lastOpenedTemplateFiles.filter(recentTemplate =>
                        existsSync(recentTemplate.path)
                    );

                    if (lastOpenedTemplateFiles.length > 0) {
                        await store.dispatch(ACTION_SET_LAST_OPENED_TEMPLATE_FILES, lastOpenedTemplateFiles);
                    }
                }
            }
        } catch (error) {
            // Ignore error since already being logged
        }

        return merge(DEFAULT_APPLICATION_SETTINGS, appSettings);
    }

    /**
     * Save application settings to file
     * @param window Main browser window instance
     * @param store Vuex store instance
     */
    public saveApplicationSettingsToFile(window: BrowserWindow, store: Store<RootState>): void {
        const windowSize = window.getSize();
        const windowPos = window.getPosition();
        const lastOpenedSplitsFiles = store.state.splitterino.meta.lastOpenedSplitsFiles;
        const lastOpenedTemplateFiles = store.state.splitterino.meta.lastOpenedTemplateFiles;
        const keybindings = store.state.splitterino.keybindings.bindings;

        const newAppSettings: ApplicationSettings = {
            windowOptions: {
                width: windowSize[0],
                height: windowSize[1],
                x: windowPos[0],
                y: windowPos[1],
            },
            lastOpenedSplitsFiles,
            lastOpenedTemplateFiles,
            keybindings,
        };

        Logger.debug({
            msg: 'Saving applcation settings to file',
            values: newAppSettings,
        });

        this.saveJSONToFile(this.appSettingsFileName, newAppSettings);
    }

    /**
     * Flattens current settings and saves them to settings file
     * @param store Store instance to retrieve settings from
     */
    public saveSettingsToFile(store: Store<RootState>) {
        const flattenedSettings = {};
        const settings = store.state.splitterino.settings.values;

        for (const [moduleKey, modulE] of Object.entries(settings)) {
            for (const [namespaceKey, namespacE] of Object.entries(modulE)) {
                for (const [groupKey, group] of Object.entries(namespacE)) {
                    for (const [settingKey, setting] of Object.entries(group)) {
                        const path = `${moduleKey}.${namespaceKey}.${groupKey}.${settingKey}`;
                        flattenedSettings[path] = setting;
                    }
                }
            }
        }

        this.saveJSONToFile(this.settingsFileName, flattenedSettings);
    }

    /**
     * Loads settings that have a configuration registered into store.
     * Sets a deault value if no value for configuration exists
     * @param store Root store instance
     */
    public async loadSettingsFromFileToStore(store: Store<RootState>) {
        const loadedSettings = this.loadJSONFromFile(this.settingsFileName);
        const parsedSettings: Settings = {
            splitterino: {
                core: {},
            },
            plugins: {},
        };

        let usedDefaultValue = false;

        for (const [moduleKey, modulE] of Object.entries(store.state.splitterino.settings.configuration)) {
            for (const namespacE of modulE) {
                for (const group of namespacE.groups) {
                    for (const setting of group.settings) {
                        let value = setting.defaultValue;
                        const path = `${moduleKey}.${namespacE.key}.${group.key}.${setting.key}`;
                        if (loadedSettings != null && loadedSettings[path] !== undefined) {
                            value = loadedSettings[path];
                        } else {
                            usedDefaultValue = true;
                        }

                        set<Settings>(parsedSettings, path, value);
                    }
                }
            }
        }

        await store.dispatch(ACTION_SET_ALL_SETTINGS, { values: parsedSettings });

        if (usedDefaultValue) {
            this.saveSettingsToFile(store);
        }
    }
}
