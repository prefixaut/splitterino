import { BrowserWindow, FileFilter } from 'electron';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { Inject, Injectable } from 'lightweight-di';
import { dirname, join } from 'path';
import { Store } from 'vuex';
import { set } from 'lodash';

import { ApplicationSettings } from '../common/interfaces/application-settings';
import { ELECTRON_INTERFACE_TOKEN, ElectronInterface } from '../common/interfaces/electron';
import { isSplits } from '../common/interfaces/splits';
import { ACTION_SET_CURRENT_OPEN_FILE, ACTION_SET_ALL_SEGMENTS } from '../store/modules/splits.module';
import { RootState } from '../store/states/root.state';
import { Logger } from '../utils/logger';
import { ACTION_SET_ALL_SETTINGS } from '../store/modules/settings.module';
import { Settings } from '../store/states/settings.state';

@Injectable
export class IOService {
    constructor(@Inject(ELECTRON_INTERFACE_TOKEN) protected electron: ElectronInterface) { }

    protected readonly assetDir = join(this.electron.getAppPath(), 'resources');
    protected readonly appSettingsFileName = 'application-settings.json';
    protected readonly settingsFileName = 'settings.json';

    public static readonly SPLITS_FILE_FILTER: FileFilter = {
        name: 'Splitterino-Splits',
        extensions: ['splits'],
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

        try {
            return readFileSync(filePath, { encoding: 'utf8' });
        } catch (e) {
            Logger.error({
                msg: 'Error loading file',
                file: filePath,
                error: e
            });
        }

        return null;
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
                    error: e
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
                error: e
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
            Logger.error({
                msg: 'Error parsing JSON from string',
                string: loadedFile,
                error: e
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

                    return Promise.resolve(false);
                }

                Logger.debug({
                    msg: 'Loading splits from File',
                    file: filePath
                });
                const loaded = this.loadJSONFromFile(filePath, '');

                if (loaded == null || typeof loaded !== 'object' || !isSplits(loaded.splits)) {
                    Logger.error({
                        msg: 'The loaded splits are not valid Splits!',
                        file: filePath,
                    });

                    throw new Error(`The loaded splits from "${filePath}" are not valid Splits!`);
                }

                Logger.debug('Loaded splits are valid! Applying to store ...');

                await store.dispatch(ACTION_SET_CURRENT_OPEN_FILE, filePath);

                return store.dispatch(ACTION_SET_ALL_SEGMENTS, [...loaded.splits.segments]);
            })
            .catch(error => {
                Logger.error({
                    msg: 'Error while loading splits',
                    error,
                });

                // Rethrow the error to be processed
                throw error;
            });
    }

    // TODO: Add documentation
    public saveSplitsFromStoreToFile(
        store: Store<RootState>,
        file?: string,
        window?: BrowserWindow
    ): Promise<boolean> {
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
                file: fileToSave
            });

            const fileContent = {
                // TODO: Saving the $schema definition as well?
                splits: {
                    segments: store.state.splitterino.splits.segments,
                }
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

        return this.electron.showOpenDialog(this.electron.getCurrentWindow(), {
            title: 'Load Splits',
            filters: [IOService.SPLITS_FILE_FILTER],
            properties: ['openFile'],
        }).then(filePaths => {
            let singlePath: string;
            if (Array.isArray(filePaths)) {
                singlePath = filePaths.length === 0 ? null : filePaths[0];
            } else if (filePaths === 'string') {
                singlePath = filePaths;
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

    // TODO: Add documentation
    public askUserToSaveSplitsFile(window?: BrowserWindow): Promise<string> {
        return this.electron.showSaveDialog(window || this.electron.getCurrentWindow(), {
            title: 'Save Splits',
            filters: [IOService.SPLITS_FILE_FILTER],
        });
    }

    // TODO: Add JSON schema validation for application settings
    /**
     * Loads application settings object from file if it exists
     * @param store Vuex store instance
     */
    public async loadApplicationSettingsFromFile(store: Store<RootState>): Promise<ApplicationSettings> {
        const appSettings = this.loadJSONFromFile(this.appSettingsFileName) as ApplicationSettings;

        if (appSettings != null && typeof appSettings === 'object') {
            if (typeof appSettings.lastOpenedSplitsFile === 'string') {
                await this.loadSplitsFromFileToStore(store, appSettings.lastOpenedSplitsFile);
            }
        }

        return appSettings || { windowOptions: {} };
    }

    /**
     * Save application settings to file
     * @param window Main browser window instance
     * @param store Vuex store instance
     */
    public saveApplicationSettingsToFile(window: BrowserWindow, store: Store<RootState>): void {
        const windowSize = window.getSize();
        const windowPos = window.getPosition();
        const lastOpenedSplitsFile = store.state.splitterino.splits.currentOpenFile;
        const keybindings = store.state.splitterino.keybindings.bindings;

        const newAppSettings: ApplicationSettings = {
            windowOptions: {
                width: windowSize[0],
                height: windowSize[1],
                x: windowPos[0],
                y: windowPos[1]
            },
            lastOpenedSplitsFile,
            keybindings,
        };

        Logger.debug({
            msg: 'Saving applcation settings to file',
            settings: newAppSettings,
        });

        this.saveJSONToFile(this.appSettingsFileName, newAppSettings);
    }

    /**
     * Flattens current settings and saves them to settings file
     * @param store Store instance to retrieve settings from
     */
    public saveSettingsToFile(store: Store<RootState>) {
        const flattenedSettings = {};
        const settings = store.state.splitterino.settings.settings;

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

    public async loadSettingsFromFileToStore(store: Store<RootState>) {
        const loadedSettings = this.loadJSONFromFile(this.settingsFileName);
        const parsedSettings: Settings = {
            splitterino: {
                core: {}
            },
            plugins: {}
        };

        if (loadedSettings != null) {
            for (const [moduleKey, modulE] of Object.entries(store.state.splitterino.settings.configuration)) {
                for (const namespacE of modulE) {
                    for (const group of namespacE.groups) {
                        for (const setting of group.settings) {
                            let value = setting.defaultValue;
                            const path = `${moduleKey}.${namespacE.key}.${group.key}.${setting.key}`;
                            if (loadedSettings[path] !== undefined) {
                                value = loadedSettings[path];
                            }

                            set<Settings>(parsedSettings, path, value);
                        }
                    }
                }
            }

            await store.dispatch(ACTION_SET_ALL_SETTINGS, { settings: parsedSettings });
        }
    }
}
