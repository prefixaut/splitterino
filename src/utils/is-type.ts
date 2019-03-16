export declare type Typeguard = (obj: any) => boolean;

export function isType(item: any, typeguards: Typeguard[]): boolean {
    for (const guard of typeguards) {
        if (!guard(item)) {
            return false;
        }
    }

    return true;
}
