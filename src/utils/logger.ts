export enum LogLevel {
    ERROR = 0b00010,
    WARN = 0b00100,
    INFO = 0b00110,
    DEBUG = 0b01000,
    TRACE = 0b01010,
    ERROR_USER = 0b00011,
    WARN_USER = 0b00101,
}
// tslint:disable:no-console
export class Logger {
    /**
     * Log a message with given log level
     *
     * @param level Level at which to log the message. Use {@link LogLevel}
     * @param messages Messages to log
     */
    public static log(level: LogLevel = LogLevel.INFO, ...messages: any[]): void {
        // tslint:disable-next-line:no-bitwise
        const isUserWarning: number = level & 0b1;
        let prefix: string;
        let logFunction: (message?: any, ...optionalParams: any[]) => void;
        let messageBoxType;
        // tslint:disable-next-line:no-bitwise no-magic-numbers
        level &= 0b1110;
        switch (level) {
            case LogLevel.ERROR: {
                prefix = 'Error';
                logFunction = console.error;
                messageBoxType = 'error';
                break;
            }
            case LogLevel.WARN: {
                prefix = 'Warn';
                logFunction = console.warn;
                messageBoxType = 'warning';
                break;
            }
            case LogLevel.INFO: {
                prefix = 'Info';
                logFunction = console.info;
                break;
            }
            case LogLevel.DEBUG: {
                prefix = 'Debug';
                logFunction = console.debug;
                break;
            }
            case LogLevel.TRACE: {
                prefix = 'Trace';
                logFunction = console.trace;
            }
        }

        logFunction(`[${prefix}]`, ...messages);
        const messageStr = messages.map(elm => String(elm)).join('\n');

        if (isUserWarning > 0) {
            // TODO: Open Electron window?
        }
    }

    public static trace(...messages: any[]) {
        Logger.log(LogLevel.TRACE, ...messages);
    }

    public static debug(...messages: any[]) {
        Logger.log(LogLevel.DEBUG, ...messages);
    }

    public static info(...messages: any[]) {
        Logger.log(LogLevel.INFO, ...messages);
    }

    public static warn(...messages: any[]) {
        Logger.log(LogLevel.WARN, ...messages);
    }

    public static error(...messages: any[]) {
        Logger.log(LogLevel.ERROR, ...messages);
    }
}
