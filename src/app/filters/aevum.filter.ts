import { Aevum } from 'aevum';

import { DEFAULT_TIMER_FORMAT } from '../../common/constants';

// Register Filters
const formatterCache = {};

export function aevumFilter(value: any, format?: string) {
    if (value == null || !isFinite(value) || isNaN(value)) {
        return '';
    }
    if (typeof format !== 'string' || format.trim().length < 1) {
        format = DEFAULT_TIMER_FORMAT;
    }
    let formatter = formatterCache[format];
    if (formatter == null) {
        formatter = new Aevum(format);
        formatterCache[format] = formatter;
    }

    return formatter.format(value, { padding: true });
}
