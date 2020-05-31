import { ActionService } from '../../src/services/action.service';

export class ActionMockService extends ActionService {
    public callStack: { function: string; args: any[] }[] = [];

    public addOpenedSplitsFile(filePath: string) {
        this.callStack.push({
            function: 'addOpenedSplitsFile',
            args: [filePath],
        });

        return super.addOpenedSplitsFile(filePath);
    }

    public startTimer(time?: number) {
        this.callStack.push({
            function: 'startTimer',
            args: [time],
        });

        return super.startTimer(time);
    }

    public splitTimer(time?: number) {
        this.callStack.push({
            function: 'splitTimer',
            args: [time],
        });

        return super.splitTimer(time);
    }

    public skipSplit() {
        this.callStack.push({
            function: 'skipSplit',
            args: []
        });

        return super.skipSplit();
    }

    public pauseTimer(igtOnly?: boolean, time?: number) {
        this.callStack.push({
            function: 'pauseTimer',
            args: [igtOnly, time],
        });

        return super.pauseTimer(igtOnly, time);
    }

    public unpauseTimer(igtOnly?: boolean, time?: number) {
        this.callStack.push({
            function: 'unpauseTimer',
            args: [igtOnly, time],
        });

        return super.unpauseTimer();
    }

    public resetTimer(windowId?: number) {
        this.callStack.push({
            function: 'resetTimer',
            args: [windowId],
        });

        return super.resetTimer(windowId);
    }

    public discardingReset() {
        this.callStack.push({
            function: 'discardingReset',
            args: [],
        });

        return super.discardingReset();
    }

    public savingReset() {
        this.callStack.push({
            function: 'savingReset',
            args: [],
        });

        return super.savingReset();
    }
}
