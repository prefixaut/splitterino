import { join, dirname } from 'path';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { Logger } from './logger';
import { remote, app } from 'electron';

const assetDir = remote ?
    join(remote.app.getAppPath(), 'resources') :
    join(app.getAppPath(), 'resources');

export function loadFile(path: string): string | null {
    try {
        return readFileSync(join(assetDir, path), { encoding: 'utf8' });
    } catch (e) {
        Logger.error('Error reading file:', join(assetDir, path), 'Reason', e);
    }

    return null;
}

export function saveFile(path: string, data: string) {
    const filePath = join(assetDir, path);

    Logger.debug('Creating file directory structure');

    try {
        mkdirSync(dirname(filePath), { recursive: true });
    } catch (e) {
        if (e.code !== 'EEXIST') {
            Logger.error(
                'Error creating directory structure:',
                dirname(filePath),
                'Reason',
                e
            );

            return;
        }
    }

    Logger.debug('Writing file', filePath);

    try {
        writeFileSync(filePath, data, { encoding: 'utf8' });
    } catch (e) {
        Logger.error('Error writing file:', filePath, 'Reason', e);
    }
}

export function loadJSONFromFile(path: string): object | null {
    try {
        return JSON.parse(loadFile(path));
    } catch (e) {
        Logger.error('Error parsing JSON', e);
    }

    return null;
}

export function saveJSONToFile(path: string, data: object) {
    saveFile(path, JSON.stringify(data, null, 4));
}
