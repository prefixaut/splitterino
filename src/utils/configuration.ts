import { isType } from './utils/is-type';

export class Configuration {

    constructor(content) {
        this._data = {};
        this.setAll(content);
    }

    has(path, type) {
        const split = path.split('.');
        split.forEach(s => {
            if (this._data.hasOwnProperty(s) && typeof this._data[s] !== 'undefined' && this._data[s] !== null) {
                this._data = this._data[s];
            } else {
                return false;
            }
        });

        if (typeof type !== 'undefined' && type !== null) {
            return isType(this._data, type);
        } else {
            return true;
        }
    }

    get(path, type, defaultValue) {
        const split = path.split('.');
        split.forEach(s => {
            if (this._data.hasOwnProperty(s) && typeof this._data[s] !== 'undefined' && this._data[s] !== null) {
                this._data = this._data[s];
            } else {
                return defaultValue;
            }
        });

        if (typeof type !== 'undefined' && type !== null) {
            return isType(this._data, type) ? this._data : defaultValue;
        } else {
            return this._data;
        }
    }

    getAll() {
        return this._data;
    }

    clear() {
        this._data = {};
    }

    set(path, content) {
        this._apply(this._data, path, content);
    }

    setAll(content) {
        this._data = (typeof content === 'object' && content !== null) ? content : {};
    }

    _apply(object, path, content) {
        if (typeof path === 'string') {
            path = path.split('.');
        }

        if (path.length > 1) {
            const first = path.shift();
            if (object[first] === null || typeof object[first] !== 'object') {
                object[first] = {};
            }
            this._apply(object[first], path, content);
        } else {
            object[path[0]] = content;
        }
    }
}
