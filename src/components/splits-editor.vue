<template>
    <div class="splits-editor">
        <div class="header">
            <h1>Splits Editor</h1>
        </div>

        <div class="content">
            <h2>Game Information</h2>

            <spl-game-info-editor />

            <h2>Segments</h2>
            <draggable element="table" class="segments" v-model="segments" :options="{handle: '.handle'}">
                <thead slot="header">
                    <tr>
                        <th class="handle"><!-- Drag-Handle --></th>
                        <th class="name">Name</th>
                        <th class="time">Time</th>
                        <th class="personal-best">Personal Best</th>
                        <th class="overall-best">Overall Best</th>
                    </tr>
                </thead>

                <transition-group tag="tbody">
                    <tr
                        class="segment-row"
                        v-for="(segment, index) of segments"
                        :key="index"
                    >
                        <td class="handle">
                            <fa-icon icon="grip-lines" />
                        </td>
                        <td class="name">
                            <spl-text-input v-model="segment.name" outline="false" />
                        </td>
                        <td class="time">
                            <spl-time-input v-model="segment.time"/>
                        </td>
                        <td class="personal-best">
                            <spl-time-input v-model="segment.personalBest" />
                        </td>
                        <td class="overall-best">
                            <spl-time-input v-model="segment.overallBest" />
                        </td>
                    </tr>
                </transition-group>
            </draggable>
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

    .footer {
        padding: 0.5rem 1.5rem;
    }
}

.segments {
    width: 100%;
}

.segment-row {
    .handle {
        padding: 5px 10px;
        margin-right: 5px;
        cursor: -webkit-grab;
    }

    &.sortable-ghost {
        background: $spl-color-light-primary;

        & >>> .text-input > input {
            background: $spl-color-light-primary;
            border-color: $spl-color-light-primary;
        }
    }
}
</style>
