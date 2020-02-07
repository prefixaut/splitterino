<template>
    <div class="open-template-prompt">
        <div class="template-file-list">
            <div
                v-for="recentTemplate of recentTemplateFiles"
                :key="recentTemplate.path"
                class="template-file-entry"
                @click="loadFile(recentTemplate.path)"
            >
                <div class="template-data">
                    <span class="template-name">{{ recentTemplate.name }}</span>
                </div>
                <div class="metadata">
                    <div class="metadata-item">{{ recentTemplate.author }}</div>
                    <div class="metadata-item">{{ recentTemplate.fileName }}</div>
                </div>
            </div>
        </div>
        <spl-button class="browse-button" @click="loadFile()">Bruhwse</spl-button>
    </div>
</template>

<script lang="ts">
import { basename } from 'path';
import { Component, Vue } from 'vue-property-decorator';

import { ELECTRON_INTERFACE_TOKEN, ElectronInterface } from '../models/electron';
import { RecentlyOpenedTemplate } from '../models/states/meta.state';
import { IO_SERVICE_TOKEN, IOService } from '../services/io.service';

@Component({ name: 'spl-open-template-prompt' })
export default class OpenTemplatePromptComponent extends Vue {
    // TODO: Export to interface
    public recentTemplateFiles: (RecentlyOpenedTemplate & { fileName: string })[] = [];
    private ioService: IOService;
    private electron: ElectronInterface;

    public created() {
        this.ioService = this.$services.get(IO_SERVICE_TOKEN);
        this.electron = this.$services.get(ELECTRON_INTERFACE_TOKEN);

        const lastTemplateFiles = this.$store.state.splitterino.meta.lastOpenedTemplateFiles;
        this.recentTemplateFiles = lastTemplateFiles
            .slice(0, 5)
            .map(file => {
                return {
                    ...file,
                    fileName: basename(file.path)
                };
            });
    }

    public async loadFile(file?: string) {
        let close = true;
        if (file != null) {
            this.electron.broadcastEvent('load-template', file);
        } else {
            close = await this.ioService.askUserToOpenTemplateFile();
        }

        if (close) {
            this.electron.closeCurrentWindow();
        }
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core';

.open-template-prompt {
    padding: 20px 30px;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .template-file-list {
        flex: 1 1 auto;
        overflow-y: auto;

        .template-file-entry {
            margin-bottom: 5px;
            width: 100%;
            padding: 5px 10px;
            background-color: rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;

            &:hover {
                cursor: pointer;
                background-color: rgba(255, 255, 255, 0.2);
            }

            .template-data {
                max-width: 70%;
                display: inline-block;

                .game-name {
                    font-weight: bold;
                }
            }

            .metadata {
                max-width: 30%;
                display: inline-flex;
                flex-direction: column;
                justify-content: space-around;

                .metadata-item {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-size: 0.875rem;
                    font-style: italic;
                    color: rgba($spl-color-off-white, 0.8);
                    height: 15px;
                    text-align: right;
                }
            }
        }
    }

    .browse-button {
        flex: 0 0 auto;
        margin-top: 10px;
    }
}
</style>
