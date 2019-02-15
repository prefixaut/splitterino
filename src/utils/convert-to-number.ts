export function convertToNumber(
    value: any,
    allowDecimals: boolean = true,
    defaultValue: number = null,
): number {
    if (value == null) {
        return defaultValue;
    }
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        if (allowDecimals) {
            return parseFloat(value);
        } else {
            return parseInt(value, 10);
        }
    }

    return defaultValue;
}
