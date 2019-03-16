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
