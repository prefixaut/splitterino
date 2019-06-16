import { createWriteStream } from 'fs';
import pino from 'pino';

// tslint:disable:no-console
export class Logger {

    // Starts with a default handler for the console
    private static logHandlers: pino.Logger[] = [pino({
        level: 'debug',
        prettyPrint: {
            colorize: true,
            translateTime: 'hh:mm:ss',
        }
    })];

    public static registerHandler(stream?: pino.DestinationStream, options?: pino.LoggerOptions) {
        this.logHandlers.push(pino(options || {}, stream));
    }

    public static trace(messageOrData: string | object) {
        this.logHandlers.forEach(handler => {
            handler.trace(messageOrData as any);
        });
    }

    public static debug(messageOrData: string | object) {
        this.logHandlers.forEach(handler => {
            handler.debug(messageOrData as any);
        });
    }

    public static info(messageOrData: string | object) {
        this.logHandlers.forEach(handler => {
            handler.info(messageOrData as any);
        });
    }

    public static warn(messageOrData: string | object) {
        this.logHandlers.forEach(handler => {
            handler.warn(messageOrData as any);
        });
    }

    public static error(messageOrData: string | object) {
        this.logHandlers.forEach(handler => {
            handler.error(messageOrData as any);
        });
    }

    public static fatal(messageOrData: string | object) {
        this.logHandlers.forEach(handler => {
            handler.fatal(messageOrData as any);
        });
    }
}
