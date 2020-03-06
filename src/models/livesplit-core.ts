import { Splits } from './splits';

export interface LiveSplitCoreInterface {
    loadSplitsViaLiveSplit(filePath: string, loadedFile: string): false | Splits;
}
