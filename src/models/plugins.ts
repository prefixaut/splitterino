import { Injector } from 'lightweight-di';

export interface Plugin {
    initialize(injector: Injector): Promise<boolean>;
    destroy(): Promise<boolean>;
}
