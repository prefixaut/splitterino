import { remote } from 'electron';
import Vue from 'vue';

import { showOpenDialog } from './electron';
import { Logger } from './logger';
import { loadJSONFromFile } from './io';
import { isSplits } from '../common/interfaces/splits';

export function askUserToLoadSplits(): Promise<void> {
    Logger.debug('Asking use to load splits ...');

    return showOpenDialog(remote.getCurrentWindow(), {
        title: 'Load Splits',
        filters: [
            {
                name: 'Splitterino-Splits',
                extensions: ['.spl.splits'],
            },
        ],
        properties: ['openFile'],
    })
        .then(filePaths => {
            let singlePath: string;
            if (Array.isArray(filePaths)) {
                singlePath = filePaths.length === 0 ? null : filePaths[0];
            } else {
                singlePath = filePaths;
            }

            if (singlePath == null) {
                Logger.debug('No files selected, ignoreing request.');

                return Promise.resolve();
            }

            Logger.debug(`Loading splits from File: "${singlePath}"`);
            const loaded = loadJSONFromFile(singlePath);
            if (!isSplits(loaded)) {
                throw new Error(`The loaded splits from "${singlePath}" are not valid Splits!`);
            }

            Logger.debug('Loaded splits are valid, applying to store');
            (Vue as any).$store.dispatch('/splitterino/splits/setAllSegments', loaded.segments);

            return Promise.resolve();
        })
        .catch(error => {
            Logger.error(error);
            // Rethrow the error to be processed
            throw error;
        });
}
