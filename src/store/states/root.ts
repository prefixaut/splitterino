import { TimerState } from './timer';
import { SplitsState } from './splits';

export interface RootState {
    splitterino: {
        timer: TimerState;
        splits: SplitsState;
    }
}
