import { type } from 'os';
import * as keycode from 'keycode';

export function keyToDisplayString(keyCode: string) {
    switch (keyCode) {
        case 'Super':
            switch (type()) {
                case 'Darwin':
                    return '⌘';
                case 'Windows_NT':
                    return 'Windows';
                default:
                    return 'Super';
            }
        default:
            return keycode.names[keyCode].toUpperCase();
    }
}

export function keyToAcceleratorString(keyCode: string) {
    switch (keyCode) {
        case 'Super':
            switch (type()) {
                case 'Darwin':
                    return 'Cmd';
                default:
                    return 'Super';
            }
        default:
            return keycode.names[keyCode].toUpperCase();
    }
}
