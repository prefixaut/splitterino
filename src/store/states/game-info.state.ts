export interface GameInfoState {
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
