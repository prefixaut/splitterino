<template>
    <div
        ref="splitsView"
        v-spl-ctx-menu="['settings', 'keybindings', 'splitter', 'templates', 'def']"
        class="default-view"
    >
        <div v-if="templateLoaded">
            <div v-if="template != null">
                <v-runtime-template :template="template" />
                <component :is="'style'" type="text/css">
                    {{ templateStyle }}
                </component>
            </div>
            <template v-else>
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
                    <spl-timer />
                    <spl-possible-time-save />
                    <spl-summary-of-best />
                    <spl-best-possible-time />
                    <spl-previous-segment />
                </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Component, Vue } from 'vue-property-decorator';

import { GLOBAL_EVENT_LOAD_TEMPLATE } from '../../common/constants';
import { TimerStatus } from '../../common/timer-status';
import { ELECTRON_INTERFACE_TOKEN, ElectronInterface } from '../../models/electron';
import { IPC_CLIENT_TOKEN, MessageType, GlobalEventBroadcast } from '../../models/ipc';
import { IOService, IO_SERVICE_TOKEN } from '../../services/io.service';
import { Logger } from '../../utils/logger';
import { openSplitsEditor, openLoadSplits } from '../../utils/windows';

@Component({ name: 'spl-default-view' })
export default class DefaultView extends Vue {

    public templateLoaded: boolean = false;
    public template: string = null;
    public templateStyle: string = null;

    private subscriptions: Subscription[] = [];

    private ioService: IOService;
    private electron: ElectronInterface;

    public created() {
        this.ioService = this.$services.get(IO_SERVICE_TOKEN);
        this.electron = this.$services.get(ELECTRON_INTERFACE_TOKEN);
    }

    public mounted() {
        this.registerDragDropHandler();

        this.loadTemplate();
        const sub = this.$services.get(IPC_CLIENT_TOKEN).listenToSubscriberSocket().pipe(
            // Trim out everything aside from the message itself
            map(packet => packet.message),
            // Filter out messages which aren't "load-template" global events
            filter(message => message.type === MessageType.BROADCAST_GLOBAL_EVENT
                && (message as GlobalEventBroadcast).eventName === GLOBAL_EVENT_LOAD_TEMPLATE
            )
        )
            .subscribe((message: GlobalEventBroadcast) => {
                this.loadTemplate(message.payload);
            });
        this.subscriptions.push(sub);
    }

    public beforeDestroy() {
        for (const sub of this.subscriptions) {
            sub.unsubscribe();
        }
    }

    public selectSplits() {
        openLoadSplits(this.electron, this.ioService, this.$store);
    }

    public editSplits() {
        openSplitsEditor(this.electron, this.$store);
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
