import { Region } from '../splits';

export interface MetaState {
    lastOpenedSplitsFiles: RecentlyOpenedSplit[];
    lastOpenedTemplateFiles: RecentlyOpenedTemplate[];
}

export interface RecentlyOpenedSplit {
    path: string;
    gameName: string;
    category: string;
    platform?: string;
    region?: Region;
}

export interface RecentlyOpenedTemplate {
    path: string;
    name: string;
    author: string;
}
