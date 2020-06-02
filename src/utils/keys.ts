import * as keycode from 'keycode';
import { type } from 'os';

export function keyToDisplayString(keyCode: string) {
    switch (keyCode.toLowerCase()) {
        case 'super':
            switch (type()) {
                case 'Darwin':
                    return '⌘';
                case 'Windows_NT':
                    return 'Windows';
                default:
                    return 'Super';
            }
        default:
            if (keycode.names[keyCode] != null) {
                return keycode.names[keyCode].toUpperCase();
            } else {
                return keyCode.toUpperCase();
            }
    }
}

export function keyToAcceleratorString(keyCode: string) {
    switch (keyCode.toLowerCase()) {
        case 'super':
            switch (type()) {
                case 'Darwin':
                    return 'Cmd';
                default:
                    return 'Super';
            }
        default:
            if (keycode.names[keyCode] != null) {
                return keycode.names[keyCode].toUpperCase();
            } else {
                return keyCode.toUpperCase();
            }
    }
}
