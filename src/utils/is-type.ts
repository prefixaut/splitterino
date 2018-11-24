export function isType(item, type) {
    if (typeof type !== 'undefined' && type !== null) {
        if (typeof type === 'string') {
            return type.toLowerCase() === 'any' ? true : typeof item === type;
        } else if (Array.isArray(type)) {
            type.forEach(i => {
                if (isType(item, i)) {
                    return true;
                }
            });
            return false;
        } else if (typeof type === 'object') {
            return Object.getPrototypeOf(item) === Object.getPrototypeOf(type);
        }
    }
    return false;
}
