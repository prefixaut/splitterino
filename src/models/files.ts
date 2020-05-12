import { Splits } from './splits';

export const MOST_RECENT_SPLITS_VERSION = '0.1';

export interface PluginMetaFile {
    /** Main plugin author */
    author: string;
    /** Optional list of contributors for plugin */
    contributors?: string[];
    /** Plugin name */
    name: string;
    /** Plugin semver */
    version: string;
    /** Semver comparison string */
    compatibleVersion: string;
    /** URL to github repository for plugin */
    repositoryURL: string;
    /** List of component paths to load relative to plugin folder */
    components?: string[];
    /** Entry file to be loaded by plugin process */
    entryFile?: string;
    /** Required dependencies for this plugin.
     *
     * Tries to load this plugin after dependencies were loaded.
     */
    dependencies?: {
        [index: string]: string;
    };
    /** Optional dependencies for this plugin.
     *
     * Tries to load this plugin after dependencies were loaded.
     */
    optionalDependencies?: {
        [index: string]: string;
    };
}

export interface SplitsFile {
    version: string;
    splits: Splits;
}

export interface TemplateMetaFile {
    author: string;
    name: string;
    version: string;
    requiredVersion: string;
}

export interface TemplateFiles {
    meta?: TemplateMetaFile;
    template?: string;
    styles?: string;
}

