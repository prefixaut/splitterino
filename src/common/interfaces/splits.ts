import * as SplitsSchema from '../../schemas/splits.schema.json';
import { createValidator, validate } from '../../utils/schemas';
import { Segment } from './segment';

const validatorFunction = createValidator(SplitsSchema);

export function isSplits(data: any): data is Splits {
    return validate(data, validatorFunction);
}

export { SplitsSchema };
export { validatorFunction as SplitsValidator };

export interface Splits {
    segments: Segment[];
}
