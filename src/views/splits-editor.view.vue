<template>
    <div class="splits-editor-view" v-spl-ctx-menu="['def']">
        <main>
            <h1>Game Information</h1>
            <spl-game-info-editor :value="gameInfo" @change="updateGameInfo($event)" />

            <div>
                <h1>Segments</h1>
                <spl-segments-editor :value="segments" @change="updateSegments($event)" />
            </div>
        </main>

        <footer>
            <spl-button
                theme="info"
                outline
                :disabled="!haveSegmentsChanged && !hasGameInfoChanged"
                @click="saveSplits()"
            >Save Splits</spl-button>
        </footer>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { isEqual, cloneDeep } from 'lodash';

import { Segment } from '../models/segment';
import { GameInfoState } from '../models/states/game-info.state';
import { IO_SERVICE_TOKEN } from '../services/io.service';
import { ACTION_SET_ALL_SEGMENTS } from '../store/modules/splits.module';
import {
    ACTION_SET_GAME_NAME,
    ACTION_SET_CATEGORY,
    ACTION_SET_LANGUAGE,
    ACTION_SET_PLATFORM,
    ACTION_SET_REGION
} from '../store/modules/game-info.module';
import { ACTION_DISABLE_BINDINGS } from '../store/modules/keybindings.module';

@Component({ name: 'spl-splits-editor-view' })
export default class SplitsEditorView extends Vue {
    /**
     * Copy of the segments from the store to be able to edit them.
     */
    public segments: Segment[] = [];

    public gameInfo: GameInfoState = {
        name: null,
        category: null,
        language: null,
        platform: null,
        region: null,
    };

    created() {
        // Disable the bindings while in the editor
        this.$store.dispatch(ACTION_DISABLE_BINDINGS, true);
    }

    mounted() {
        this.loadDataFromStore();
    }

    beforeDestroy() {
        // Enable the bindings again, as the editor is getting removed
        this.$store.dispatch(ACTION_DISABLE_BINDINGS, false);
    }

    loadDataFromStore() {
        const root = this.$store.state;
        // Create a copy of the current Segments to the component
        // They should not be reactive as editing it would be quite
        // a trouble.
        this.segments = cloneDeep(root.splitterino.splits.segments || []);
        // Same here
        this.gameInfo = cloneDeep(root.splitterino.gameInfo);
    }

    get haveSegmentsChanged() {
        return !isEqual(
            this.$store.state.splitterino.splits.segments,
            this.segments
        );
    }

    get hasGameInfoChanged() {
        return !isEqual(this.$store.state.splitterino.gameInfo, this.gameInfo);
    }

    updateSegments(segments: Segment[]) {
        this.segments = segments;
    }

    updateGameInfo(gameInfo: GameInfoState) {
        this.gameInfo = gameInfo;
    }

    async saveSplits() {
        await Promise.all([
            this.$store.dispatch(ACTION_SET_ALL_SEGMENTS, this.segments),
            this.$store.dispatch(ACTION_SET_GAME_NAME, this.gameInfo.name),
            this.$store.dispatch(ACTION_SET_CATEGORY, this.gameInfo.category),
            this.$store.dispatch(ACTION_SET_LANGUAGE, this.gameInfo.language),
            this.$store.dispatch(ACTION_SET_PLATFORM, this.gameInfo.platform),
            this.$store.dispatch(ACTION_SET_REGION, this.gameInfo.region),
        ]);

        this.loadDataFromStore();
        const meta = this.$store.state.splitterino.meta;
        let path: string = null;
        if (meta.lastOpenedSplitsFiles != null && meta.lastOpenedSplitsFiles.length > 0) {
            path = meta.lastOpenedSplitsFiles[0].path;
        }
        const didSave = await this.$services.get(IO_SERVICE_TOKEN)
            .saveSplitsFromStoreToFile(this.$store, path);
        if (didSave) {
            window.close();
        }
    }
}
</script>

<style lang="scss" scoped>
.splits-editor-view {
    height: 100%;
    display: flex;
    flex-direction: column;

    > .content {
        flex-shrink: 2;
        @media (min-height: 300px) {
            overflow: auto;
        }
    }

    h1,
    h2 {
        margin-left: 1.5rem;
        margin-right: 1.5rem;
    }

    footer {
        padding: 0.5rem 1.5rem;
    }
}
</style>
