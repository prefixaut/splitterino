import { isType, Typeguard } from './is-type';
import { merge } from 'lodash';

interface Content { [name: string]: any; }

export class Configuration {
    private data: Content = {};

    constructor(content?: Content) {
        this.setAll(content);
    }

    public has(path: string | string[], typeguards: Typeguard[] = []): boolean {
        return isType(this.getValue(path), typeguards);
    }

    public get(
        path: string | string[],
        defaultValue: any = null,
        typeguards: Typeguard[]
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
        this.apply(path, item);
    }

    public setAll(content: Content): void {
        this.data = content != null ? content : {};
    }

    private getValue(path: string | string[]): any {
        if (!Array.isArray(path)) {
            path = path.split('.');
        }

        return path.reduce(
            (obj: object, i: string) => obj.hasOwnProperty(i) ? obj[i] : null,
            this.data
        );
    }

    private apply(path: string | string[], item: any): void {
        if (typeof path === 'string') {
            path = path.split('.');
        }

        let obj = {};
        for (let i = 0; i < path.length - 1; i++) {
            obj = obj[path[i]] = {};
        }
        obj[path[path.length - 1]] = item;
        merge(this.data, obj);
    }
}
