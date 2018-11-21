import { SplitsState } from './splits';
import { TimerState } from './timer';

export interface RootState {
    splitterino: {
        timer: TimerState;
        splits: SplitsState;
    }
}
