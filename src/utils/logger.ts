import pino from 'pino';
import { remote } from 'electron';
import { Injector } from 'lightweight-di';
import { ELECTRON_INTERFACE_TOKEN } from '../common/interfaces/electron';

/**
 * Wrapper Class to nearly log all messages from Splitterino
 * and Plugins in one centralized and unified way.
 *
 * Currently using the pino library for handling log messages.
 */
export class Logger {

    // Starts with a default handler for the console
    private static logHandlers: pino.Logger[] = [pino({
        level: 'debug',
        prettyPrint: {
            colorize: true,
            translateTime: 'hh:mm:ss',
        },
    })];
    private static isInitialized = false;
    private static windowId: number = null;

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

    public static initialize(injector: Injector) {
        if (this.isInitialized) {
            return;
        }

        const electron = injector.get(ELECTRON_INTERFACE_TOKEN);
        const window = electron.getCurrentWindow();
        if (window != null && typeof window.id === 'number') {
            this.windowId = window.id;
        }
        this.isInitialized = true;
    }

    public static registerHandler(stream?: pino.DestinationStream, options?: pino.LoggerOptions) {
        this.logHandlers.push(pino(options || {}, stream));
    }

    public static trace(messageOrData: string | object) {
        const data = this.enrichMessage(messageOrData);
        this.logHandlers.forEach(handler => {
            handler.trace(data);
        });
    }

    public static debug(messageOrData: string | object) {
        const data = this.enrichMessage(messageOrData);
        this.logHandlers.forEach(handler => {
            handler.debug(data);
        });
    }

    public static info(messageOrData: string | object) {
        const data = this.enrichMessage(messageOrData);
        this.logHandlers.forEach(handler => {
            handler.info(data);
        });
    }

    public static warn(messageOrData: string | object) {
        const data = this.enrichMessage(messageOrData);
        this.logHandlers.forEach(handler => {
            handler.warn(data);
        });
    }

    public static error(messageOrData: string | object) {
        const data = this.enrichMessage(messageOrData);
        this.logHandlers.forEach(handler => {
            handler.error(data);
        });
    }

    public static fatal(messageOrData: string | object) {
        const data = this.enrichMessage(messageOrData);
        this.logHandlers.forEach(handler => {
            handler.fatal(data);
        });
    }
}
