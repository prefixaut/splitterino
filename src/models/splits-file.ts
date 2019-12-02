import { Splits } from './splits';

export const MOST_RECENT_SPLITS_VERSION = '0.1';

export interface SplitsFile {
    version: string;
    splits: Splits;
}
