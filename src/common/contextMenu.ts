import { remote } from 'electron';

export function reloadWindow() {
    location.reload();
}

export function closeWindow() {
    remote.getCurrentWindow().close();
}
