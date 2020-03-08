import { Splits } from './splits';
import { InjectionToken } from 'lightweight-di';

export const LIVESPLIT_CORE_SERVICE_TOKEN = new InjectionToken<LiveSplitCoreInterface>('livesplit-core');
export interface LiveSplitCoreInterface {
    loadSplitsViaLiveSplit(filePath: string, loadedFile: string): false | Splits;
}
