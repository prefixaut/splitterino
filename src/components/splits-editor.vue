<template>
    <div class="splits-editor">
        <div class="header">
            <h1>Splits Editor</h1>
        </div>

        <div class="content">
            <h2>Game Information</h2>

            <h2>Segments</h2>
            <div class="segments">
                <draggable v-model="segments" :options="{handle: '.handle'}">
                    <transition-group>
                        <div
                            class="segment-wrapper"
                            v-for="(segment, index) of segments"
                            :key="index"
                        >
                            <div class="handle">
                                <fa-icon icon="grip-lines" />
                            </div>
                            <spl-segment-editor v-model="segments[index]" />
                        </div>
                    </transition-group>
                </draggable>
            </div>
        </div>

        <div class="footer">
            <spl-button
                theme="info"
                outline
                :disabled="!haveSegmentsChanged"
                @click="saveSplits()"
            >Save Splits</spl-button>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { isEqual, cloneDeep } from 'lodash';

import { Segment } from '../common/segment';

const splits = namespace('splitterino/splits');

@Component
export default class SplitsEditorComponent extends Vue {
    /**
     * Copy of the segments from the store to be able to edit them.
     */
    public segments: Segment[] = [];

    created() {
        // Create a copy of the current Segments to the component
        // They should not be reactive as editing it would be quite
        // a trouble.
        this.segments = cloneDeep(
            this.$store.state.splitterino.splits.segments || []);
    }

    get haveSegmentsChanged() {
        return isEqual(
            this.$store.state.splitterino.splits.segments,
            this.segments
        );
    }

    saveSplits() {
        this.$store.dispatch('setSegments', this.segments);
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core.scss';

.splits-editor {
    height: 100%;
    display: flex;
    flex-direction: column;

    > .content {
        flex: 1 0 auto;
    }

    > .header,
    > .footer {
        flex-shrink: 0;
    }
}

.segment-wrapper {
    > * {
        display: inline-block;
    }

    .handle {
        padding: 5px 10px;
        margin-right: 5px;
        cursor: -webkit-grab;
    }

    &.sortable-ghost {
        background: $spl-color-light-primary;
    }
}
</style>
