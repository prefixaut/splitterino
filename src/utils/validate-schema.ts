import Ajv from 'ajv';
import { Logger, LogLevel } from './logger';

/**
 * Validates object through given schema
 * @param schema Schema object for validation
 * @param toValidate Object to validate
 *
 * @returns Validation result
 * @author SirChronus
 */
export function validateSchema(schema: object, toValidate: object): boolean {
    const ajv = new Ajv();
    const valid = ajv.validate(schema, toValidate) as boolean;
    if (!valid) {
        Logger.log(LogLevel.ERROR, ajv.errorsText());
    }

    return valid;
}
