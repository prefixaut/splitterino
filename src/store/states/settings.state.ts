/** Settings state */
export interface SettingsState {
    /** Configuration for settings */
    configuration: SettingsConfiguration;
    /** Settings object with current values */
    values: Settings;
}

export interface Settings {
    splitterino: {
        core: SettingsNamespace;
    };
    plugins: {
        [index: string]: SettingsNamespace;
    };
}

export interface SettingsNamespace {
    [index: string]: SettingsGroup;
}

export interface SettingsGroup {
    [index: string]: unknown;
}

interface AbstractSettingsConfiguration {
    key: string;
    label: string;
}

export interface SettingsConfiguration {
    splitterino: SettingsConfigurationNamespace[];
    plugins: SettingsConfigurationNamespace[];
}

export interface SettingsConfigurationNamespace extends AbstractSettingsConfiguration {
    groups: SettingsConfigurationGroup[];
}

export interface SettingsConfigurationGroup extends AbstractSettingsConfiguration {
    settings: SettingsConfigurationValue[];
}

export interface SettingsConfigurationValue extends AbstractSettingsConfiguration {
    defaultValue: any;
    component: string;
    componentProps: { [index: string]: any };
}
