import fs from 'mz/fs';
import path from 'path';

import { Configuration } from './configuration';

export class FileConfiguration extends Configuration {

    constructor(content) {
        super(content);
    }

    async load(file, defaultValue, applyDefaultValue) {
        if (typeof file !== 'string') {
            return Promise.reject(new TypeError('file is not a string, it was: ' + typeof file + '(' + JSON.stringify(file) + ')'));
        }

        return fs.readFile(file).then(read => {
            const data = JSON.parse(read);
            this.setAll(applyDefaultValue ? {
                ...defaultValue,
                ...data,
            } : data);
        }).catch(async err => {
            const parent = path.dirname(file);
            if (await !fs.exists(parent)) {
                await fs.mkdir(parent);
            }
            await fs.writeFile(file, JSON.stringify(defaultValue));
            this.setAll(defaultValue);
        }).then(() => {
            this._latestLoad = file;
            return this.getAll();
        });
    }

    async save(file) {
        if (typeof file === 'undefined' && this._latestLoad === 'string') {
            file = this._latestLoad;
        } else if (typeof file !== 'string') {
            return Promise.reject(new TypeError());
        }

        return fs.writeFile(file, JSON.stringify(this.getAll())).then(() => true);
    }
}
