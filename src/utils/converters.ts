import { Segment } from '../models/splits';
import { getFinalTime } from './time';

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
    return (typeof value !== 'number' || isNaN(value) || !isFinite(value)) ? cleanValue : value;
}

export function asSaveableSegment(segment: Segment): any {
    const out: any = {
        id: segment.id,
        name: segment.name,
        passed: !!segment.passed,
        skipped: !!segment.skipped,
    };

    if (segment.personalBest != null && (
        getFinalTime(segment.personalBest.rta) > 0 ||
        getFinalTime(segment.personalBest.igt) > 0
    )) {
        out.personalBest = segment.personalBest;
    }
    if (segment.overallBest != null && (
        getFinalTime(segment.overallBest.rta) > 0 ||
        getFinalTime(segment.overallBest.igt) > 0
    )) {
        out.overallBest = segment.overallBest;
    }

    return out;
}
