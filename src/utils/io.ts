import { app, BrowserWindow, FileFilter, remote } from 'electron';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import Vue from 'vue';

import { isSplits } from '../common/interfaces/splits';
import { showOpenDialog, showSaveDialog } from './electron';
import { Logger } from './logger';

const assetDir = remote ? join(remote.app.getAppPath(), 'resources') : join(app.getAppPath(), 'resources');

export const SPLITS_FILE_FILTER: FileFilter = {
    name: 'Splitterino-Splits',
    extensions: ['splits'],
};

export function loadFile(path: string, basePath: string = assetDir): string | null {
    try {
        return readFileSync(join(basePath, path), { encoding: 'utf8' });
    } catch (e) {
        Logger.error('Error reading file:', join(assetDir, path), 'Reason', e);
    }

    return null;
}

export function saveFile(path: string, data: string, basePath: string = assetDir): boolean {
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

export function loadJSONFromFile(path: string, basePath: string = assetDir): any {
    try {
        return JSON.parse(loadFile(path, basePath));
    } catch (e) {
        Logger.error('Error parsing JSON', e);
    }

    return null;
}

export function saveJSONToFile(path: string, data: object, basePath: string = assetDir): boolean {
    return saveFile(path, JSON.stringify(data, null, 4), basePath);
}

/**
 * Attempts to load splits from a File to the store.
 * When no File is specified, it's asking the user to select a splits-file.
 *
 * @param file Optional. The splits-file which should be loaded into the store.
 *
 * @returns A Promise which resolves to if the file was successfully loaded into store.
 */
export function loadSplitsFromFileToStore(instance: Vue, file?: string): Promise<boolean> {
    let fileSelect: Promise<string>;

    if (file != null) {
        Logger.debug(`Loading splits from provided File "${file}"`);
        fileSelect = Promise.resolve(file);
    } else {
        fileSelect = askUserToOpenSplitsFile();
    }

    return fileSelect
        .then(filePath => {
            if (filePath == null) {
                Logger.debug('No files selected, skipping loading');

                return Promise.resolve(false);
            }

            Logger.debug(`Loading splits from File: "${filePath}"`);
            const loaded = loadJSONFromFile(filePath, '');
            if (loaded == null || typeof loaded !== 'object' || !isSplits(loaded.splits)) {
                throw new Error(`The loaded splits from "${filePath}" are not valid Splits!`);
            }

            Logger.debug('Loaded splits are valid, applying to store');

            return instance.$store.dispatch('splitterino/splits/setSegments', [loaded.splits.segments])
                .then(() => true);
        })
        .catch(error => {
            Logger.error('Error while loading splits', error);

            // Rethrow the error to be processed
            throw error;
        });
}

export function saveSplitsFromStoreToFile(instance: Vue, file?: string, window?: BrowserWindow): Promise<boolean> {
    let fileSelect: Promise<string>;
    if (file != null) {
        fileSelect = Promise.resolve(file);
    } else {
        fileSelect = askUserToSaveSplitsFile(window);
    }

    return fileSelect.then(fileToSave => {
        Logger.debug(`Saving to the File: ${fileToSave}`);
        if (fileToSave == null) {
            return false;
        }

        const fileContent = {
            splits: {
                segments: instance.$store.state.splitterino.splits.segments,
            }
        };

        return saveJSONToFile(fileToSave, fileContent, '');
    });
}

/**
 * Opens a File-Browser to select a single splits-file.
 *
 * @returns A Promise which resolves to the path of the splits-file.
 */
export function askUserToOpenSplitsFile(): Promise<string> {
    Logger.debug('Asking user to select a Splits-File');

    return showOpenDialog(remote.getCurrentWindow(), {
        title: 'Load Splits',
        filters: [SPLITS_FILE_FILTER],
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

export function askUserToSaveSplitsFile(window?: BrowserWindow): Promise<string> {
    return showSaveDialog(window || remote.getCurrentWindow(), {
        title: 'Save Splits',
        filters: [SPLITS_FILE_FILTER],
    });
}
