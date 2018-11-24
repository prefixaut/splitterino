import { isType } from './is-type';

interface Content { [name: string]: any; }

export class Configuration {
    private data: Content = {};

    constructor (content?: Content) {
        if (content) {
            this.setAll(content);
        }
    }

    public has (path: string | string[], type?: string): boolean {
        const split = this.toPath(path);

        for (const splitPart in split) {
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

    public get (path: string | string[], defaultValue: any = null, type?: string) {
        const split = this.toPath(path);

        for (const splitPart in split) {
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

    public getAll (): Content {
        return this.data;
    }

    public clear (): void {
        this.data = {};
    }

    public set (path, content): void {
        this.apply(this.data, path, content);
    }

    public setAll (content): void {
        this.data =
            typeof content === 'object' && content !== null ? content : {};
    }

    private toPath (path: string | string[]): string[] {
        if (typeof path === 'string') {
            return path.includes('.') ? path.split('.') : [path];
        }

        return path;
    }

    private apply (object, path, content): void {
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
