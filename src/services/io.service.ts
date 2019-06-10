import { BrowserWindow, FileFilter } from 'electron';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { Inject, Injectable } from 'lightweight-di';
import { dirname, join } from 'path';
import { Store } from 'vuex';

import { ApplicationSettings } from '../common/interfaces/application-settings';
import { ELECTRON_INTERFACE_TOKEN, ElectronInterface } from '../common/interfaces/electron';
import { isSplits } from '../common/interfaces/splits';
import { RootState } from '../store/states/root.state';
import { Logger } from '../utils/logger';
import { ACTION_SET_SEGMENTS, ACTION_SET_CURRENT_OPEN_FILE } from '../store/modules/splits.module';

@Injectable
export class IOService {
    constructor(@Inject(ELECTRON_INTERFACE_TOKEN) protected electron: ElectronInterface) { }

    protected readonly assetDir = join(this.electron.getAppPath(), 'resources');
    protected readonly appSettingsFileName = 'application-settings.json';

    public static readonly SPLITS_FILE_FILTER: FileFilter = {
        name: 'Splitterino-Splits',
        extensions: ['splits'],
    };

    public loadFile(path: string, basePath: string = this.assetDir): string | null {
        try {
            return readFileSync(join(basePath, path), { encoding: 'utf8' });
        } catch (e) {
            Logger.error('Error reading file:', join(this.assetDir, path), 'Reason', e);
        }

        return null;
    }

    public saveFile(path: string, data: string, basePath: string = this.assetDir): boolean {
        const filePath = join(basePath, path);

        Logger.debug('Creating file directory structure');

        try {
            mkdirSync(dirname(filePath), { recursive: true });
        } catch (e) {
            if (e.code !== 'EEXIST') {
                Logger.error('Error creating directory structure:', dirname(filePath), 'Reason', e);

                return false;
            }
        }

        Logger.debug('Writing file', filePath, data);

        try {
            writeFileSync(filePath, data, { encoding: 'utf8' });
        } catch (e) {
            Logger.error('Error writing file:', filePath, 'Reason', e);

            return false;
        }

        return true;
    }

    public loadJSONFromFile(path: string, basePath: string = this.assetDir): any {
        try {
            return JSON.parse(this.loadFile(path, basePath));
        } catch (e) {
            Logger.error('Error parsing JSON', e);
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
            Logger.debug(`Loading splits from provided File "${file}"`);
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

                Logger.debug(`Loading splits from File: "${filePath}"`);
                const loaded = this.loadJSONFromFile(filePath, '');
                if (loaded == null || typeof loaded !== 'object' || !isSplits(loaded.splits)) {
                    throw new Error(`The loaded splits from "${filePath}" are not valid Splits!`);
                }

                Logger.debug('Loaded splits are valid, applying to store');

                store.dispatch(ACTION_SET_CURRENT_OPEN_FILE, filePath);

                return store.dispatch(ACTION_SET_SEGMENTS, [...loaded.splits.segments]);
            })
            .catch(error => {
                Logger.error('Error while loading splits', error);

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
            fileSelect = Promise.resolve(file);
        } else {
            fileSelect = this.askUserToSaveSplitsFile(window);
        }

        return fileSelect.then(fileToSave => {
            Logger.debug(`Saving to the File: ${fileToSave}`);
            if (fileToSave == null) {
                return false;
            }

            const fileContent = {
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
        Logger.debug('Asking user to select a Splits-File');

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

        if (appSettings) {
            if (appSettings.lastOpenedSplitsFile) {
                await this.loadSplitsFromFileToStore(store, appSettings.lastOpenedSplitsFile);
            }
        }

        return appSettings;
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

        const newAppSettings: ApplicationSettings = {
            window: {
                width: windowSize[0],
                height: windowSize[1],
                x: windowPos[0],
                y: windowPos[1]
            },
            lastOpenedSplitsFile
        };

        this.saveJSONToFile(this.appSettingsFileName, newAppSettings);
    }
}
