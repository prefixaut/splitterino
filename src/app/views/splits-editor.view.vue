<template>
    <div v-spl-ctx-menu="['def']" class="splits-editor-view">
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
import { isEqual, cloneDeep } from 'lodash';
import { Vue, Component } from 'vue-property-decorator';

import {
    HANDLER_SET_KEYBINDINGS_DISABLE_BINDINGS,
    HANDLER_SET_ALL_SPLITS_SEGMENTS,
    HANDLER_APPLY_GAME_INFO
} from '../../common/constants';
import { Segment } from '../../models/splits';
import { IO_SERVICE_TOKEN } from '../../models/services';
import { GameInfoState } from '../../models/states/game-info.state';

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
        this.$commit(HANDLER_SET_KEYBINDINGS_DISABLE_BINDINGS, true);
    }

    mounted() {
        this.loadDataFromStore();
    }

    beforeDestroy() {
        // Enable the bindings again, as the editor is getting removed
        this.$commit(HANDLER_SET_KEYBINDINGS_DISABLE_BINDINGS, false);
    }

    loadDataFromStore() {
        const root = this.$state;
        // Create a copy of the current Segments to the component
        // They should not be reactive as editing it would be quite
        // a trouble.
        this.segments = cloneDeep(root.splitterino.splits.segments || []);
        // Same here
        this.gameInfo = cloneDeep(root.splitterino.gameInfo);
    }

    get haveSegmentsChanged() {
        return !isEqual(this.$state.splitterino.splits.segments, this.segments);
    }

    get hasGameInfoChanged() {
        return !isEqual(this.$state.splitterino.gameInfo, this.gameInfo);
    }

    updateSegments(segments: Segment[]) {
        this.segments = segments;
    }

    updateGameInfo(gameInfo: GameInfoState) {
        this.gameInfo = gameInfo;
    }

    async saveSplits() {
        await Promise.all([
            this.$commit(HANDLER_SET_ALL_SPLITS_SEGMENTS, this.segments),
            this.$commit(HANDLER_APPLY_GAME_INFO, this.gameInfo),
        ]);

        this.loadDataFromStore();
        const meta = this.$state.splitterino.meta;
        let path: string = null;
        if (meta.lastOpenedSplitsFiles != null && meta.lastOpenedSplitsFiles.length > 0) {
            path = meta.lastOpenedSplitsFiles[0].path;
        }
        const didSave = await this.$services.get(IO_SERVICE_TOKEN).saveSplitsFromStoreToFile(path);
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
