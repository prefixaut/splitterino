<template>
    <div class="previous-segment">
        <div class="label">{{ label }}</div>
        <div class="time">{{ previousSegmentTime | aevum(format) }}</div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

import AevumFormatMixin from '../mixins/aevum-format.mixin.vue';
import { Segment, TimingMethod } from '../../models/splits';
import { getFinalTime } from '../../utils/time';

const splits = namespace('splitterino/splits');

@Component({
    name: 'spl-previous-segment',
    mixins: [AevumFormatMixin],
})
export default class PreviousSegmentComponent extends Vue {
    @Prop({ type: String, default: 'Previous Segment' })
    public label: string;

    @splits.State('segments')
    public segments: Segment[];

    @splits.State('current')
    public currentSegment: number;

    @splits.State('timing')
    public timing: TimingMethod;

    public get previousSegmentTime() {
        // Either it's not present (-1) or the first split (0), then there's no previous segment
        if (this.currentSegment < 1) {
            return null;
        }
        let previousPace = 0;
        for (let i = 0; i < this.currentSegment - 1; i++) {
            const pace = this.getPaceFromSegment(this.segments[i]);
            if (pace != null) {
                previousPace += pace;
            }
        }
        const segment = this.segments[this.currentSegment - 1];
        const segmentPace = this.getPaceFromSegment(segment);
        if (segmentPace != null) {
            return segmentPace - previousPace;
        }

        return null;
    }

    private getPaceFromSegment(segment: Segment): number | null {
        if (
            segment.personalBest != null &&
            segment.personalBest[this.timing] != null &&
            segment.passed &&
            segment.currentTime != null &&
            segment.currentTime[this.timing] != null
        ) {
            return getFinalTime(segment.currentTime[this.timing]) - getFinalTime(segment.personalBest[this.timing]);
        }

        return null;
    }
}
</script>

<style lang="scss" scoped>
.previous-segment {
    display: flex;
    flex-wrap: nowrap;

    .label {
        flex: 1 1 auto;
    }

    .time {
        flex: 0 0 auto;
        text-align: right;
    }
}
</style>
