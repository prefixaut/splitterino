export function convertToBoolean(
    value: any,
    defaultValue: boolean = false
): boolean {
    if (value == null) {
        return defaultValue;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') {
            return true;
        }
        if (value.toLowerCase() === 'false') {
            return false;
        }
    }

    return defaultValue;
}

export function convertToNumber(
    value: any,
    allowDecimals: boolean = true,
    defaultValue: number = null,
): number {
    if (value == null) {
        return defaultValue;
    }
    if (typeof value === 'number') {
        return asCleanNumber(value);
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

export function asCleanNumber(value: number, cleanValue: number = 0) {
    return (isNaN(value) || !isFinite(value)) ? cleanValue : value;
}
