export enum TimingMethod {
    /** Real-Time Attack */
    RTA = 'rta',
    /** In Game Time */
    IGT = 'igt',
}

export interface Splits {
    segments: Segment[];
    timing: TimingMethod;
    game: GameInfo;
}

export enum Region {
    /**
     * Default value for PAL Regions.
     * Is set to the same value as PAL_EUR.
     */
    PAL = 'pal_eur',
    /**
     * European PAL Format.
     */
    PAL_EUR = 'pal_eur',
    /**
     * Chinese PAL Format.
     */
    PAL_CHN = 'pal_chn',
    /**
     * Brazilian PAL Format.
     */
    PAL_BRA = 'pal_bra',
    /**
     * Default value for NTSC Regions.
     * Is se the the same value as NTSC_USA.
     */
    NTSC = 'ntsc_usa',
    /**
     * USA / North American NTSC Format.
     */
    NTSC_USA = 'ntsc_usa',
    /**
     * Japanese NTSC Format.
     */
    NTSC_JPN = 'ntsc_jpn',
}

/**
 * Game-Info (Metadata)
 */
export interface GameInfo {
    /**
     * Name of the Game that is currently being run
     */
    name: string;
    /**
     * Category that is currently being run
     */
    category: string;
    /**
     * ISO-3166-1 Alpha 2 Language Code in which the game is being run
     */
    language?: string;
    /**
     * The Platform on which the Game is being run on
     */
    platform?: string;
    /**
     * The Region format the game is run in
     */
    region?: Region;
}

/**
 * Defines a single Segment in a Split.
 * Contains all basic information need to calculate
 * and save the times.
 */
export interface Segment {
    /**
     * ID of the segment to identify it.
     * Format is a UUID (v4).
     */
    id: string;
    /**
     * Display-Name of the Segment.
     */
    name: string;
    /**
     * The time of the personal best in milliseconds.
     */
    personalBest?: SegmentTime;
    /**
     * The time of the overall best in milliseconds.
     */
    overallBest?: SegmentTime;
    /**
     * If the Segment has been passed successfully.
     * Usually the opposite of `skipped`.
     */
    passed?: boolean;
    /**
     * If the Segment has been skipped.
     * Usually the opposite of `passed`.
     */
    skipped?: boolean;

    /*
     * Internal properties used for calculations and to keep
     * track of the segment state.
     */

    /**
     * The time of the current Segment.
     */
    currentTime?: SegmentTime;
    /**
     * Internal timestamp when the segment started.
     */
    startTime?: number;
    /**
     * If the currently set overall best has been overridden
     * and can be reverted from {@link previousOverallBest}.
     */
    hasNewOverallBest?: boolean;
    /**
     * Backup of the overall best for when the segment is
     * getting resetted and should revert the content.
     */
    previousOverallBest?: SegmentTime;
}

export interface SegmentTime {
    igt: DetailedTime;
    rta: DetailedTime;
}

export interface DetailedTime {
    rawTime: number;
    pauseTime: number;
}
