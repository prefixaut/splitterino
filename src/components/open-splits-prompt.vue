<template>
    <div class="open-splits-prompt">
        <div class="splits-file-list">
            <div
                v-for="recentSplit of recentSplitFiles"
                :key="recentSplit.path"
                class="splits-file-entry"
                @click="loadFile(recentSplit.path)"
            >
                <div class="splits-data">
                    <span class="game-name">{{ recentSplit.gameName }}</span> - {{ recentSplit.category }}
                </div>
                <div class="metadata">
                    <div class="metadata-item">{{ recentSplit.platform }} - {{ recentSplit.regionDisplay }}</div>
                    <div class="metadata-item">{{ recentSplit.fileName }}</div>
                </div>
            </div>
        </div>
        <spl-button class="browse-button" @click="loadFile()">Bruhwse</spl-button>
    </div>
</template>

<script lang="ts">
import { upperCase } from 'lodash';
import { basename } from 'path';
import { Component, Vue } from 'vue-property-decorator';

import { ELECTRON_INTERFACE_TOKEN, ElectronInterface } from '../models/electron';
import { RecentlyOpenedSplit } from '../models/states/meta.state';
import { IO_SERVICE_TOKEN, IOService } from '../services/io.service';

@Component({ name: 'spl-open-splits-prompt' })
export default class OpenSplitsPromptComponent extends Vue {
    // TODO: Export to interface
    public recentSplitFiles: (RecentlyOpenedSplit & { fileName: string; regionDisplay: string })[] = [];
    private ioService: IOService;
    private electron: ElectronInterface;

    public created() {
        this.ioService = this.$services.get(IO_SERVICE_TOKEN);
        this.electron = this.$services.get(ELECTRON_INTERFACE_TOKEN);

        const lastSplitFiles = this.$store.state.splitterino.meta.lastOpenedSplitsFiles;
        this.recentSplitFiles = lastSplitFiles
            .slice(0, 5)
            .map(file => {
                return {
                    ...file,
                    fileName: basename(file.path),
                    regionDisplay: upperCase(file.region)
                };
            });
    }

    public async loadFile(file?: string) {
        const loaded = await this.ioService.loadSplitsFromFileToStore(this.$store, file);
        if (loaded) {
            this.electron.closeCurrentWindow();
        } else {
            this.electron.showMessageDialog(
                this.electron.getCurrentWindow(),
                {
                    title: 'Could not load splits file',
                    message: 'Splits file could not be loaded. Make sure it exists.',
                    type: 'error',
                }
            );
        }
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core';

.open-splits-prompt {
    padding: 20px 30px;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .splits-file-list {
        flex: 1 1 auto;
        overflow-y: auto;

        .splits-file-entry {
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

            .splits-data {
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
