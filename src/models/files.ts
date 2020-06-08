import { Splits } from './splits';
import { PluginIdentifier } from './states/plugin.state';

export const MOST_RECENT_SPLITS_VERSION = '0.1';

export interface Dependencies {
    [index: string]: string;
}

/**
 * Contains meta information about a plugin e.g. version, author, ...
 */
export interface PluginMetaFile extends PluginIdentifier {
    /** Main plugin author */
    author: string;
    /** Optional list of contributors for plugin */
    contributors?: string[];
    /** Plugin display-name */
    displayName?: string;
    /** Description of the Plugin */
    decription?: string;
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
    dependencies?: Dependencies;
    /** Optional dependencies for this plugin.
     *
     * Tries to load this plugin after dependencies were loaded.
     */
    optionalDependencies?: Dependencies;
}

/**
 * Meta information for splits file
 */
export interface SplitsFile {
    /** Splits file format version */
    version: string;
    /** The timings themself */
    splits: Splits;
}

/**
 * Contains meta information for a template e.g. author, name, ...
 */
export interface TemplateMetaFile {
    /** Template author */
    author: string;
    /** Template name */
    name: string;
    /** Template version */
    version: string;
    /** Required splitterino version to guarantee compatibility */
    requiredVersion: string;
}

/** Contains main information for a template */
export interface TemplateFiles {
    /** Meta information for template e.g. author, name, ... */
    meta?: TemplateMetaFile;
    /** Name of template file */
    template?: string;
    /** Name of styles file */
    styles?: string;
}

