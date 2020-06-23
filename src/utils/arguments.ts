import { options } from 'optimist';

import { LogLevel } from '../common/log-level';
import { Arguments } from '../models/arguments';
import { isDevelopment } from './internal';

/**
 * Parses command line arguments to Arguments object
 */
export function parseArguments(): Arguments {
    const parsedArgs = setupArguments();

    if (parsedArgs._.length > 0) {
        // Check for splits file
        if (!isDevelopment() && parsedArgs._[0].endsWith('.splits')) {
            parsedArgs.splitsFile = parsedArgs._[0];
        }
    }

    return parsedArgs;
}

/**
 * Configures yargs to parse arguments
 */
function setupArguments(): Arguments & { _: string[]; $0: string } {
    return options('log-level', {
        default: isDevelopment() ? LogLevel.DEBUG : LogLevel.INFO,
        describe: 'sets level for logger'
    }).parse(process.argv);
}
