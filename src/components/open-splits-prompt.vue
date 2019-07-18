<template>
    <div class="open-splits-prompt">
        <div class="splits-file-list">
            <div
                v-for="file of recentSplitFiles"
                :key="file.path"
                class="splits-file-entry"
                @click="loadFile(file.path)"
            >{{ file.name }}</div>
        </div>
        <spl-button @click="loadFile()">Bruhwse</spl-button>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { basename } from 'path';

import { RootState } from '../store/states/root.state';
import { IO_SERVICE_TOKEN } from '../services/io.service';
import { ELECTRON_INTERFACE_TOKEN } from '../common/interfaces/electron';

@Component({ name: 'spl-open-splits-prompt' })
export default class OpenSplitsPromptComponent extends Vue {
    // TODO: Export to interface
    public recentSplitFiles: { path: string; name: string }[] = [];
    private ioService = this.$services.get(IO_SERVICE_TOKEN);
    private electron = this.$services.get(ELECTRON_INTERFACE_TOKEN);

    public created() {
        const lastSplitFiles = (this.$store.state as RootState).splitterino.meta.lastOpenedSplitsFiles;
        this.recentSplitFiles = lastSplitFiles.slice(0, 5).map(file => ({ path: file, name: basename(file) }));
    }

    public async loadFile(file?: string) {
        const loaded = await this.ioService.loadSplitsFromFileToStore(this.$store, file);
        if (loaded) {
            this.electron.closeCurrentWindow();
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

    & > .splits-file-list {
        flex: 1 1 auto;

        & > .splits-file-entry {
            margin-bottom: 5px;
            width: 100%;
            padding: 5px 10px;
            background-color: rgba(255, 255, 255, 0.1);

            &:hover {
                cursor: pointer;
                background-color: rgba(255, 255, 255, 0.2);
            }
        }
    }
}
</style>
