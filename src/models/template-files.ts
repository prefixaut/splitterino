export interface TemplateMetaFile {
    author: string;
    name: string;
    version: string;
    requiredVersion: string;
}

export interface TemplateFiles {
    meta?: TemplateMetaFile;
    template?: string;
    styles?: string;
}
