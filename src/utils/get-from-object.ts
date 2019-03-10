export function getValueFromObject(o: object, path: string | string[]): any {
    if (!Array.isArray(path)) {
        path = path.split('.');
    }

    return path.reduce(
        (obj: object, i: string) =>
            obj != null && obj.hasOwnProperty(i) ? obj[i] : null,
            o
    );
}
