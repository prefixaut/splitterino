import {
    BrowserWindow,
    BrowserWindowConstructorOptions,
    Menu,
    MessageBoxOptions,
    OpenDialogOptions,
    SaveDialogOptions,
} from 'electron';
import { Dirent } from 'fs';
import { InjectionToken } from 'lightweight-di';
import { VNode } from 'vue';

import { Commit, StoreState } from '../models/store';
import { ApplicationSettings } from './application-settings';
import { ContextMenuItem } from './context-menu-item';
import { PluginMetaFile, SplitsFile, TemplateFiles, TemplateMetaFile } from './files';
import { IPCClientInterface, IPCServerInterface } from './ipc';
import { Segment, Splits } from './splits';
import { RootState } from './states/root.state';

export const ACTION_SERVICE_TOKEN = new InjectionToken<ActionServiceInterface>('action');
export const ELECTRON_SERVICE_TOKEN = new InjectionToken<ElectronServiceInterface>('electron');
export const IO_SERVICE_TOKEN = new InjectionToken<IOServiceInterface>('io');
export const IPC_CLIENT_SERVICE_TOKEN = new InjectionToken<IPCClientInterface>('ipc-client');
export const IPC_SERVER_SERVICE_TOKEN = new InjectionToken<IPCServerInterface>('ipc-server');
export const STORE_SERVICE_TOKEN = new InjectionToken<StoreInterface<RootState>>('store');
export const TRANSFORMER_SERVICE_TOKEN = new InjectionToken<TransformerServiceInterface>('transformer');
export const VALIDATOR_SERVICE_TOKEN = new InjectionToken<ValidatorServiceInterface>('validator');

export interface ActionServiceInterface {
    addOpenedSplitsFile(filePath: string): Promise<boolean>;
    startTimer(time?: number): Promise<boolean>;
    splitTimer(time?: number): Promise<boolean>;
    skipSplit(): Promise<boolean>;
    revertSplit(): Promise<boolean>;
    pauseTimer(igtOnly?: boolean, time?: number): Promise<boolean>;
    unpauseTimer(igtOnly?: boolean, time?: number): Promise<boolean>;
    resetTimer(windowId?: number): Promise<boolean>;
    discardingReset(): Promise<boolean>;
    savingReset(): Promise<boolean>;
}

export interface ElectronServiceInterface {
    isRenderProcess(): boolean;
    getAppPath(): string;
    getWindowById(id: number): BrowserWindow;
    getCurrentWindow(): BrowserWindow;
    reloadCurrentWindow(): void;
    closeCurrentWindow(): void;
    showOpenDialog(browserWindow: BrowserWindow, options: OpenDialogOptions): Promise<string[]>;
    showSaveDialog(browserWindow: BrowserWindow, options: SaveDialogOptions): Promise<string>;
    showMessageDialog(browserWindow: BrowserWindow, options: MessageBoxOptions): Promise<number>;
    newWindow(settings: BrowserWindowConstructorOptions, route: string): BrowserWindow;
    createMenu(menuItems: ContextMenuItem[], vNode: VNode): Menu;
    broadcastEvent(event: string, payload?: any): void;
}

export interface IOServiceInterface {
    getAssetDirectory(): string;
    getPluginDirectory(): string;
    loadFile(path: string, basePath?: string): string | null;
    saveFile(path: string, data: string, basePath?: string): boolean;
    loadJSONFromFile(path: string, basePath?: string): any;
    saveJSONToFile(path: string, data: object, basePath?: string): boolean;
    listDirectoryContent(path: string, basePath?: string): Dirent[];
    listDirectories(path: string, basePath?: string): Dirent[];
    loadSplitsFromFileToStore(file?: string): Promise<boolean>;
    saveSplitsFromStoreToFile(file?: string, window?: BrowserWindow): Promise<boolean>;
    askUserToOpenSplitsFile(): Promise<string>;
    loadTemplateFile(file?: string): Promise<TemplateFiles | null>;
    askUserToOpenTemplateFile(): Promise<boolean>;
    askUserToSaveSplitsFile(window?: BrowserWindow): Promise<string>;
    loadApplicationSettingsFromFile(splitsFile?: string): Promise<ApplicationSettings>;
    saveApplicationSettingsToFile(window: BrowserWindow): void;
    saveSettingsToFile(): void;
    loadSettingsFromFileToStore(): Promise<void>;
}

export interface StoreInterface<S extends StoreState> {
    state: S;
    monotonousId: number;
    commit(handlerOrCommit: string | Commit, data?: any): Promise<boolean>;
}

export interface TransformerServiceInterface {
    upgradeSplitsFile(splits: any, originVersion: string, toVersion?: string): SplitsFile;
    downgradeSplitsFile(splits: any, originVersion: string, toVersion: string): any;
}

export interface ValidatorServiceInterface {
    validate<T>(schema: string, data: any): data is T;
    isSplits(data: any): data is Splits;
    isSegment(data: any): data is Segment;
    isApplicationSettings(data: any): data is ApplicationSettings;
    isTemplateMetaFile(data: any): data is TemplateMetaFile;
    isPluginMetaFile(data: any): data is PluginMetaFile;
}
