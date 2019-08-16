import { Region } from './game-info.state';

export interface MetaState {
    lastOpenedSplitsFiles: RecentlyOpenedSplit[];
    lastOpenedTemplateFiles: string[];
}

export interface RecentlyOpenedSplit {
    path: string;
    gameName: string;
    category: string;
    platform?: string;
    region?: Region;
}
