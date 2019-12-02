import { Segment, TimingMethod } from './segment';
import { GameInfoState } from './states/game-info.state';

export interface Splits {
    segments: Segment[];
    timing: TimingMethod;
    game: GameInfoState;
}
