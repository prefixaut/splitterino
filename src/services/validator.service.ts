import Ajv from 'ajv';
import { Injectable } from 'lightweight-di';
import { valid as validSemver, validRange as validSemverRange } from 'semver';

import { ApplicationSettings } from '../models/application-settings';
import { PluginMetaFile, TemplateMetaFile } from '../models/files';
import { ValidatorServiceInterface } from '../models/services';
import { Segment, Splits } from '../models/splits';
import ApplicationSettingsSchema from '../schemas/application-settings.schema.json';
import DetailedTimeSchema from '../schemas/detailed-time.schema.json';
import GameInfoSchema from '../schemas/game-info.schema.json';
import KeybindingSchema from '../schemas/keybinding.schema.json';
import MetaSchema from '../schemas/meta.schema.json';
import PluginMetaSchema from '../schemas/plugin-meta.schema.json';
import SegmentTimeSchema from '../schemas/segment-time.schema.json';
import SegmentSchema from '../schemas/segment.schema.json';
import SplitsSchema from '../schemas/splits.schema.json';
import TimingMethodSchema from '../schemas/timing-method.schema.json';
import { Logger } from '../utils/logger';
import { RecentlyOpenedSplit } from '../models/states/meta.state';

@Injectable
export class ValidatorService implements ValidatorServiceInterface {
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
        this.ajv.addSchema(PluginMetaSchema, 'plugin-meta.schema.json');
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

    public isPluginMetaFile(data: any): data is PluginMetaFile {
        if (!this.validate<PluginMetaFile>('plugin-meta.schema.json', data)) {
            return false;
        }

        // Check if field is valid semver
        if (validSemver(data.version) == null) {
            Logger.warn({
                msg: 'Field "version" in plugin meta file is not a valid semver string',
                pluginName: data.name,
                invalidVersionString: data.version
            });

            return false;
        }

        if (validSemverRange(data.compatibleVersion) == null) {
            Logger.warn({
                msg: 'Field "compatibleVersion" in plugin meta file is not a valid semver range',
                pluginName: data.name,
                invalidVersionString: data.compatibleVersion
            });

            return false;
        }

        for (const [depName, depVersion] of Object.entries(data.dependencies ?? {})) {
            if (validSemverRange(depVersion) == null) {
                Logger.warn({
                    msg: 'Version range in "dependency" field in plugin meta file not valid',
                    pluginName: data.name,
                    depName,
                    invalidVersionString: depVersion
                });

                return false;
            }
        }

        for (const [depName, depVersion] of Object.entries(data.optionalDependencies ?? {})) {
            if (validSemverRange(depVersion) == null) {
                Logger.warn({
                    msg: 'Version range in "optionalDependencies" field in plugin meta file not valid',
                    pluginName: data.name,
                    depName,
                    invalidVersionString: depVersion
                });

                return false;
            }
        }

        return true;
    }

    public isRecentlyOpenedSplit(split: any): split is RecentlyOpenedSplit {
        return split != null
            && typeof split === 'object'
            && typeof split.path === 'string'
            && typeof split.category === 'string'
            && typeof split.region === 'string';
    }
}
