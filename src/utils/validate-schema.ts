import Ajv from 'ajv';

const ajv = new Ajv();

// tslint:disable:no-empty-interface
/**
 * Interface which extends the Ajv Validator-Function with an generic
 * which is used to determine the Type the validator is checking for.
 */
export interface ValidatorFunction<T> extends Ajv.ValidateFunction {}
// tslint:enable:no-empty-interface

/**
 * Utility function to create a validator-function out of a json-schema.
 *
 * @param schema The loaded json-schema
 *
 * @returns The created validator function
 */
export function createValidator<T>(schema: object): ValidatorFunction<T> {
    return ajv.compile(schema);
}

/**
 * Validates the data with a validator-function and acts
 * as type-guard for the type of the validator-function.
 *
 * @param data The data that shall get validated
 * @param validator A validator function which determines if the data is valid
 *
 * @returns Validation result
 */
export function validate<T>(
    data: any,
    validator: ValidatorFunction<T>
): data is T {
    return validator(data) === true;
}
