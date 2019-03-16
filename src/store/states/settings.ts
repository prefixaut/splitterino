/** Settings state */
export interface SettingsState {
    /** Configuration for settings */
    configuration: SettingsGroupConfigurationObject[];
    /** Settings object with current values */
    settings: Settings;
}

/** Settings configuration */
export interface SettingsConfigurationObject {
    /** Key of setting in settings object */
    key: string;
    /** Type for internal usage */
    type: 'setting';
    /** Label to be displayed to user */
    label: string;
    /** Component to use for setting */
    component: string;
    /** Optional: Properties to pass to component */
    props?: SettingsConfigurationComponentProperty;
    /**
     * Default value to use
     *
     * Used when nothing is set in settings file
     * or when reseting to default settings
     */
    defaultValue: any;
}

/** Properties for settings component */
export interface SettingsConfigurationComponentProperty {
    /** Property for settings component */
    [key: string]: any;
}

/** Settings group configuration */
export interface SettingsGroupConfigurationObject {
    /** Key of group in settings object */
    key: string;
    /** Type for internal usage */
    type: 'group';
    /** Label to be displayed to user */
    label: string;
    /** Children array */
    children: SettingsConfigurationObject[] |
              SettingsGroupConfigurationObject[];
}

/**
 * Top level settings object
 *
 * Contains immutable namespaces for spliterino and plugins
 */
export interface Settings {
    /** Splitterino settings namespace container */
    splitterino: SplitterinoSettingsNamespace;
    /** Plugin settings namespace container */
    plugins: PluginsSettingsNamespace;
}

/**
 * Splitterino settings namespace
 *
 * Contains core settings namespace
 */
export interface SplitterinoSettingsNamespace {
    /** Core settings namespace */
    core: SettingsNamespace;
}

/**
 * Plugins settings namespace
 *
 * Contains any namespaces for registered plugins
 */
export interface PluginsSettingsNamespace {
    /** Plugin namespace */
    [key: string]: SettingsNamespace;
}

/**
 * Interface for settins namespaces
 *
 * Contains groups, nested groups or settings
 */
export interface SettingsNamespace {
    /** Group, nested group or setting */
    [key: string]: any;
}
