import { get, set } from 'lodash';

import { isType, Typeguard } from './is-type';

interface Content { [name: string]: any; }

export class Configuration {
    private data: Content = {};

    constructor(content?: Content) {
        this.setAll(content);
    }

    public has(path: string | string[], typeguards: Typeguard[] = []): boolean {
        const value = this.getValue(path);

        return value == null ? false : isType(this.getValue(path), typeguards);
    }

    public get(
        path: string | string[],
        defaultValue: any = null,
        typeguards: Typeguard[] = []
    ) {
        const value = this.getValue(path);

        return value == null ?
            defaultValue : (isType(value, typeguards) ? value : defaultValue);
    }

    public getAll(): Content {
        return this.data;
    }

    public clear(): void {
        this.data = {};
    }

    public set(path: string | string[], item: any): void {
        if (Array.isArray(path)) {
            path = path.join('.');
        }
        set(this.data, path, item);
    }

    public setAll(content: Content): void {
        this.data = content != null ? content : {};
    }

    private getValue(path: string | string[]): any {
        return get(this.data, path);
    }
}
