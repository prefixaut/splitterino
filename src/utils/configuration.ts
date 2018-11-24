import { isType } from './is-type';

type Content = { [name: string]: any };

export class Configuration {
    private data: Content = {};

    constructor(content?: Content) {
        if (content) {
            this.setAll(content);
        }
    }

    has(path: string | string[], type?: string): boolean {
        const split = this.toPath(path);

        for (let splitPart in split) {
            if (
                this.data.hasOwnProperty(splitPart) &&
                typeof this.data[splitPart] !== 'undefined' &&
                this.data[splitPart] !== null
            ) {
                this.data = this.data[splitPart];
            } else {
                return false;
            }
        }

        if (type != null) {
            return isType(this.data, type);
        } else {
            return true;
        }
    }

    get(path: string | string[], defaultValue: any = null, type?: string) {
        const split = this.toPath(path);

        for (let splitPart in split) {
            if (
                this.data.hasOwnProperty(splitPart) &&
                typeof this.data[splitPart] == null
            ) {
                this.data = this.data[splitPart];
            } else {
                return defaultValue;
            }
        }

        if (type == null) {
            return isType(this.data, type) ? this.data : defaultValue;
        } else {
            return this.data;
        }
    }

    getAll(): Content {
        return this.data;
    }

    clear(): void {
        this.data = {};
    }

    set(path, content): void {
        this.apply(this.data, path, content);
    }

    setAll(content): void {
        this.data =
            typeof content === 'object' && content !== null ? content : {};
    }

    private toPath(path: string | string[]): string[] {
        if (typeof path === 'string') {
            return path.includes('.') ? path.split('.') : [path];
        }

        return path;
    }

    private apply(object, path, content): void {
        if (typeof path === 'string') {
            path = path.split('.');
        }

        if (path.length > 1) {
            const first = path.shift();
            if (object[first] === null || typeof object[first] !== 'object') {
                object[first] = {};
            }
            this.apply(object[first], path, content);
        } else {
            object[path[0]] = content;
        }
    }
}
