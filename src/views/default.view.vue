<template>
    <div
        class="default-view"
        v-spl-ctx-menu="['settings', 'keybindings', 'splitter', 'def']"
        ref="splitsView"
    >
        <spl-splits>
            <div class="container">
                <p>No Splits are currently loaded! Please load some or create new ones</p>
                <div class="button-wrapper">
                    <spl-button class="select-button" outline @click="selectSplits()">Select Splits</spl-button>
                    <spl-button class="create-button" outline @click="editSplits()">Create Splits</spl-button>
                </div>
            </div>
        </spl-splits>
        <div class="container">
            <spl-timer/>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { RootState } from '../store/states/root.state';
import { TimerStatus } from '../common/timer-status';
import { IOService, IO_SERVICE_TOKEN } from '../services/io.service';
import { openSplitsBrowser, openSplitsEditor } from '../utils/windows';
import { ELECTRON_INTERFACE_TOKEN } from '../common/interfaces/electron';

@Component({ name: 'spl-default-view' })
export default class DefaultView extends Vue {
    private ioService: IOService = this.$services.get(IO_SERVICE_TOKEN);

    public mounted() {
        if (this.$refs.splitsView != null) {
            (this.$refs.splitsView as HTMLElement).addEventListener('dragover', (event: DragEvent) => {
                event.preventDefault();
            });
            (this.$refs.splitsView as HTMLElement).addEventListener('drop', (event: DragEvent) => {
                event.preventDefault();
                if (event.dataTransfer.files.length > 0) {
                    const filePath = event.dataTransfer.files[0].path;
                    // ? Maybe warn user when trying to load splits file and timer is not stopped
                    // ? Maybe also warn user in general when splits file is corrupt/invalid
                    if (
                        filePath.endsWith('.splits') &&
                        (this.$store.state as RootState).splitterino.timer.status === TimerStatus.STOPPED
                    ) {
                        this.ioService.loadSplitsFromFileToStore(this.$store, filePath);
                    }
                }

                return false;
            });
        }
    }

    selectSplits() {
        openSplitsBrowser(this.$services.get(ELECTRON_INTERFACE_TOKEN));
    }

    editSplits() {
        openSplitsEditor(this.$services.get(ELECTRON_INTERFACE_TOKEN), this.$store);
    }
}
</script>

<style lang="scss" scoped>
.default-view {
    height: 100%;
}

.button-wrapper {
    margin-left: -10px;
}

.select-button,
.create-button {
    margin: 10px;
}
</style>
