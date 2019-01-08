<template>
    <div class="splits-editor">
        <h1>Splits Editor</h1>

        <h2>Game Information</h2>

        <h2>Segments</h2>
        <div class="segments">
            <draggable v-model="segments">
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

        <div slot="footer" class="manage-row">
            <spl-button theme="info" outline @click="saveSplits()">Save Splits</spl-button>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

import { Segment } from '../common/segment';

const splits = namespace('splitterino/splits');

@Component
export default class SplitsEditorComponent extends Vue {
    public segments: Segment[] = [];

    created() {
        // Create a copy of the current Segments to the component
        // They should not be reactive as editing it would be quite
        // a trouble.
        this.segments = (this.$store.state.splitterino.splits.segments || [])
            .slice(0);
    }

    saveSplits() {
        this.$store.dispatch('setSegments', this.segments);
    }
}
</script>

<style lang="scss" scoped>

</style>
