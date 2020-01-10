import { Injector } from 'lightweight-di';
import pino from 'pino';

import { ELECTRON_INTERFACE_TOKEN, ElectronInterface } from '../models/electron';
import { IPCClient, IPC_CLIENT_TOKEN } from '../common/ipc/client';
import { LogOnServerRequest, MessageType } from '../models/ipc';
import uuid from 'uuid';

/**
 * Enum to map log levels
 */
export enum LogLevel {
    TRACE = 'trace',
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    FATAL = 'fatal'
}

/**
 * Wrapper Class to nearly log all messages from Splitterino
 * and Plugins in one centralized and unified way.
 *
 * Currently using the pino library for handling log messages.
 */
export class Logger {

    // Starts with a default handler for the console
    private static logHandlers: pino.Logger[] = [];
    private static isInitialized = false;
    private static windowId: number = null;
    private static electron: ElectronInterface;
    private static ipcClient: IPCClient;

    private static enrichMessage(messageOrData: string | object): object {
        let data: object = {
            isMainThread: this.windowId == null,
            windowId: this.windowId,
        };

        if (typeof messageOrData === 'string') {
            data = {
                ...data,
                msg: messageOrData,
            };
        } else {
            data = {
                ...(messageOrData || {}),
                ...data,
            };
        }

        return data;
    }

    public static initialize(injector: Injector, logLevel: LogLevel) {
        if (this.isInitialized) {
            return;
        }
        this.electron = injector.get(ELECTRON_INTERFACE_TOKEN);
        if (this.electron.isRenderProcess()) {
            this.ipcClient = injector.get(IPC_CLIENT_TOKEN);
        }

        this.logHandlers.push(pino({
            level: logLevel,
            base: null,
            prettyPrint: {
                colorize: true,
                translateTime: 'SYS:HH:MM:ss',
                ignore: 'isMainThread,windowId'
            },
        }));

        const window = this.electron.getCurrentWindow();
        if (window != null && typeof window.id === 'number') {
            this.windowId = window.id;
        }
        this.isInitialized = true;
    }

    public static registerHandler(stream?: pino.DestinationStream, options?: pino.LoggerOptions) {
        this.logHandlers.push(pino(options || {}, stream));
    }

    /**
     * Internal function! Do not use unless you know what you're doing.
     * Prone to change! Use the regular logging functions instead if possible.
     *
     * @param logFnName The logging function to call in the handlers
     * @param data The data which the handlers should receive
     */
    public static _logToHandlers(logFnName: LogLevel, data: object) {
        if (this.ipcClient && this.electron.isRenderProcess()) {
            const message: LogOnServerRequest = {
                id: uuid(),
                type: MessageType.REQUEST_LOG_ON_SERVER,
                level: logFnName,
                message: data,
            };
            this.ipcClient.sendDealerMessage(message);
        }

        this.logHandlers.forEach(handler => {
            handler[logFnName](data);
        });
    }

    /**
     * Internal function! Do not use unless you know what you're doing.
     * Updates the log-level of the initial logger (stdout).
     *
     * @param level The new log-level to use
     */
    public static _setInitialLogLevel(level: LogLevel) {
        this.logHandlers[0].level = level;
    }

    public static trace(messageOrData: string | object) {
        const data = this.enrichMessage(messageOrData);
        this._logToHandlers(LogLevel.TRACE, data);
    }

    public static debug(messageOrData: string | object) {
        const data = this.enrichMessage(messageOrData);
        this._logToHandlers(LogLevel.DEBUG, data);
    }

    public static info(messageOrData: string | object) {
        const data = this.enrichMessage(messageOrData);
        this._logToHandlers(LogLevel.INFO, data);
    }

    public static warn(messageOrData: string | object) {
        const data = this.enrichMessage(messageOrData);
        this._logToHandlers(LogLevel.WARN, data);
    }

    public static error(messageOrData: string | object) {
        const data = this.enrichMessage(messageOrData);
        this._logToHandlers(LogLevel.ERROR, data);
    }

    public static fatal(messageOrData: string | object) {
        const data = this.enrichMessage(messageOrData);
        this._logToHandlers(LogLevel.FATAL, data);
    }
}
