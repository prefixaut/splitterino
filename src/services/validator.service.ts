import { Injectable, InjectionToken } from 'lightweight-di';
import Ajv from 'ajv';

import DetailedTimeSchema from '../schemas/detailed-time.schema.json';
import SegmentTimeSchema from '../schemas/segment-time.schema.json';
import SegmentSchema from '../schemas/segment.schema.json';
import SplitsSchema from '../schemas/splits.schema.json';
import TimingMethodSchema from '../schemas/timing-method.schema.json';
import GameInfoSchema from '../schemas/game-info.schema.json';
import ApplicationSettingsSchema from '../schemas/application-settings.schema.json';
import KeybindingSchema from '../schemas/keybinding.schema.json';
import MetaSchema from '../schemas/meta.schema.json';
import { Logger } from '../utils/logger';
import { Splits } from '../common/interfaces/splits';
import { Segment } from '../common/interfaces/segment';
import { ApplicationSettings } from '../common/interfaces/application-settings.js';
import { TemplateMetaFile } from '../common/interfaces/template-files.js';

export const VALIDATOR_SERVICE_TOKEN = new InjectionToken<ValidatorService>('validator');

@Injectable
export class ValidatorService {
    private readonly ajv = new Ajv();

    constructor() {
        this.registerSchemas();
    }

    private registerSchemas() {
        this.ajv.addSchema(DetailedTimeSchema, 'detailed-time.schema.json');
        this.ajv.addSchema(SegmentTimeSchema, 'segment-time.schema.json');
        this.ajv.addSchema(SegmentSchema, 'segment.schema.json');
        this.ajv.addSchema(SplitsSchema, 'splits.schema.json');
        this.ajv.addSchema(TimingMethodSchema, 'timing-method.schema.json');
        this.ajv.addSchema(GameInfoSchema, 'game-info.schema.json');
        this.ajv.addSchema(ApplicationSettingsSchema, 'application-settings.schema.json');
        this.ajv.addSchema(KeybindingSchema, 'keybinding.schema.json');
        this.ajv.addSchema(MetaSchema, 'meta.schema.json');
    }

    /**
     * Validate data against a registered schema
     * @param schema Registered schema key
     * @param data Data to validate
     */
    public validate<T>(schema: string, data: any): data is T {
        const valid = this.ajv.validate(schema, data);

        // Explicit comparison to check for promise
        if (valid === true) {
            return true;
        }

        Logger.debug({ msg: 'Data could not be validated against schema', error: this.ajv.errors[0] });

        return false;
    }

    public isSplits(data: any): data is Splits {
        return this.validate<Splits>('splits', data);
    }

    public isSegment(data: any): data is Segment {
        return this.validate<Segment>('segment', data);
    }

    public isApplicationSettings(data: any): data is ApplicationSettings {
        return this.validate<ApplicationSettings>('application-settings', data);
    }

    public isTemplateMetaFile(data: any): data is TemplateMetaFile {
        return this.validate<TemplateMetaFile>('meta.schema.json', data);
    }
}
