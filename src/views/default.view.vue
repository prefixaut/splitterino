<template>
    <div
        class="default-view"
        v-spl-ctx-menu="['settings', 'keybindings', 'splitter', 'templates', 'def']"
        ref="splitsView"
    >
        <div v-if="templateLoaded">
            <div v-if="template != null">
                <v-runtime-template :template="template"/>
                <component :is="'style'" type="text/css">
                    {{ templateStyle }}
                </component>
            </div>
            <template v-else>
                <spl-splits
                    :pinLastSegment="pinLastSegment"
                    :visibleUpcomingSegments="visibleUpcomingSegments"
                    :visiblePreviousSegments="visiblePreviousSegments"
                    :segmentTimeFormat="segmentTimeFormat"
                    :comparisonTimeFormat="comparisonTimeFormat"
                >
                    <div class="container">
                        <p>No Splits are currently loaded! Please load some or create new ones</p>
                        <div class="button-wrapper">
                            <spl-button class="select-button" outline @click="selectSplits()">Select Splits</spl-button>
                            <spl-button class="create-button" outline @click="editSplits()">Create Splits</spl-button>
                        </div>
                    </div>
                </spl-splits>
                <div class="container">
                    <spl-timer :format="timerFormat" />
                    <spl-possible-time-save/>
                    <spl-summary-of-best/>
                    <spl-best-possible-time/>
                    <spl-previous-segment/>
                </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { Subscription } from 'rxjs';
import { Component, Vue } from 'vue-property-decorator';

import { TimerStatus } from '../common/timer-status';
import { ELECTRON_INTERFACE_TOKEN, ElectronInterface } from '../models/electron';
import { IOService, IO_SERVICE_TOKEN } from '../services/io.service';
import { MUTATION_ADD_OPENED_TEMPLATE_FILE } from '../store/modules/meta.module';
import { GETTER_VALUE_BY_PATH } from '../store/modules/settings.module';
import { Logger } from '../utils/logger';
import { openSplitsBrowser, openSplitsEditor, openLoadSplits } from '../utils/windows';

@Component({ name: 'spl-default-view' })
export default class DefaultView extends Vue {
    public templateLoaded: boolean = false;
    public template: string = null;
    public templateStyle: string = null;

    private subscriptions: Subscription[] = [];

    private readonly ioService: IOService = this.$services.get(IO_SERVICE_TOKEN);
    private readonly electron: ElectronInterface = this.$services.get(ELECTRON_INTERFACE_TOKEN);

    public get pinLastSegment() {
        return this.$store.getters[GETTER_VALUE_BY_PATH]('splitterino.core.splits.pinLastSegment');
    }

    public get visibleUpcomingSegments() {
        return this.$store.getters[GETTER_VALUE_BY_PATH]('splitterino.core.splits.visibleUpcomingSegments');
    }

    public get visiblePreviousSegments() {
        return this.$store.getters[GETTER_VALUE_BY_PATH]('splitterino.core.splits.visiblePreviousSegments');
    }

    public get segmentTimeFormat() {
        return this.$store.getters[GETTER_VALUE_BY_PATH]('splitterino.core.splits.formatSegmentTime');
    }

    public get comparisonTimeFormat() {
        return this.$store.getters[GETTER_VALUE_BY_PATH]('splitterino.core.splits.formatComparisonTime');
    }

    public get timerFormat() {
        return this.$store.getters[GETTER_VALUE_BY_PATH]('splitterino.core.timer.format');
    }

    public selectSplits() {
        openLoadSplits(
            this.$services.get(ELECTRON_INTERFACE_TOKEN),
            this.$services.get(IO_SERVICE_TOKEN),
            this.$store
        );
    }

    public editSplits() {
        openSplitsEditor(this.$services.get(ELECTRON_INTERFACE_TOKEN), this.$store);
    }

    public mounted() {
        this.registerDragDropHandler();

        this.loadTemplate();
        const sub = this.electron.listenEvent<string>('load-template').subscribe(templateFile => {
            this.loadTemplate(templateFile);
        });
        this.subscriptions.push(sub);
    }

    public beforeDestroy() {
        for (const sub of this.subscriptions) {
            sub.unsubscribe();
        }
    }

    private async loadTemplate(templateFile?: string) {
        const templateFiles = await this.ioService.loadTemplateFile(this.$store, templateFile);

        if (templateFiles == null) {
            Logger.warn({
                msg: 'Could not load template file'
            });

            // Check if template is already loaded
            // If not, fall back to default template
            if (this.template == null) {
                Logger.warn({
                    msg: 'Falling back to default template'
                });
                this.template = null;
            }
        } else {
            this.template = templateFiles.template;
            this.templateStyle = templateFiles.styles;
        }

        this.templateLoaded = true;
    }

    private registerDragDropHandler() {
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
                        this.$store.state.splitterino.timer.status === TimerStatus.STOPPED
                    ) {
                        this.ioService.loadSplitsFromFileToStore(this.$store, filePath);
                    }
                }

                return false;
            });
        }
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
