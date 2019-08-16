import { Injectable, InjectionToken } from 'lightweight-di';
import { cloneDeep } from 'lodash';

import { MOST_RECENT_SPLITS_VERSION, SplitsFile } from '../common/interfaces/splits-file';

export const TRANSFORMER_SERVICE_TOKEN = new InjectionToken<TransformerService>('transformer');

export interface SplitsVersionTransformer {
    fromVersion: string;
    toVersion: string;
    upgradeTransformer(data: any): any;
    downgradeTransformer(data: any): any;
}

@Injectable
export class TransformerService {
    private splitsVersionTransformers: SplitsVersionTransformer[] = [
        { // Transformer to update unversioned alpha versions to 0.1
            from: undefined,
            toVersion: MOST_RECENT_SPLITS_VERSION,
            upgradeTransformer: (data: any) => ({ ...data, version: MOST_RECENT_SPLITS_VERSION }),
            downgradeTransformer: (data: any) => ({ ...data, version: MOST_RECENT_SPLITS_VERSION }),
        } as any,
    ];

    constructor() {
        // Empty contstructor
    }

    public upgradeSplitsFile(splits: any, originVersion: string): SplitsFile;

    public upgradeSplitsFile(splits: any, originVersion: string, toVersion: string = MOST_RECENT_SPLITS_VERSION): any {
        // No Migration needed, already same version
        if (originVersion === toVersion) {
            return splits;
        }

        let currentVersion = originVersion;
        let transformer: SplitsVersionTransformer;
        let upgradedSplits = splits;

        do {
            transformer = this.findUpgradeTransformer(currentVersion);
            if (transformer == null) {
                break;
            }
            upgradedSplits = transformer.upgradeTransformer(cloneDeep(upgradedSplits));
            currentVersion = transformer.toVersion;
        } while (currentVersion !== toVersion);

        if (currentVersion !== toVersion) {
            throw new Error(`No transformer found to convert from ${currentVersion} to ${toVersion}!`);
        }

        return upgradedSplits;
    }

    private findUpgradeTransformer(fromVersion: string): SplitsVersionTransformer {
        return this.splitsVersionTransformers
            .find(aTransformer => aTransformer.fromVersion === fromVersion);
    }

    public downgradeSplitsFile(splits: any, originVersion: string, toVersion: string): any {
        // No Migration needed, already same version
        if (originVersion === toVersion) {
            return splits;
        }

        let currentVersion = originVersion;
        let transformer: SplitsVersionTransformer;
        let upgradedSplits = splits;

        do {
            transformer = this.findDowngradeTransformer(currentVersion);
            if (transformer == null) {
                break;
            }
            upgradedSplits = transformer.downgradeTransformer(cloneDeep(upgradedSplits));
            currentVersion = transformer.fromVersion;
        } while (currentVersion !== toVersion);

        if (currentVersion !== toVersion) {
            throw new Error(`No transformer found to convert from ${currentVersion} to ${toVersion}!`);
        }

        return upgradedSplits;
    }

    private findDowngradeTransformer(toVersion: string): SplitsVersionTransformer {
        return this.splitsVersionTransformers
            .find(aTransformer => aTransformer.toVersion === toVersion);
    }
}
