<template>
    <div class="summary-of-best">
        <div class="label">{{ label }}</div>
        <div class="time">{{ summary | aevum(format) }}</div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

import AevumFormatMixin from '../mixins/aevum-format.mixin.vue';
import { Segment, TimingMethod } from '../../models/splits';
import { State } from '../../utils/store';
import { getFinalTime } from '../../utils/time';

@Component({
    name: 'spl-summary-of-best',
    mixins: [AevumFormatMixin],
})
export default class SummaryOfBestComponent extends Vue {
    @Prop({ type: String, default: 'Sum of Best' })
    public label: string;

    @State('splitterino.splits.segments')
    public segments: Segment[];

    @State('splitterino.splits.timing')
    public timing: TimingMethod;

    public get summary() {
        const segmentsWithOB = this.segments
            .filter(segment => (
                segment.overallBest != null &&
                segment.overallBest[this.timing] != null &&
                getFinalTime(segment.overallBest[this.timing])
            ));

        if (segmentsWithOB.length === this.segments.length) {
            return segmentsWithOB.reduce(
                (previousValue, segment) => previousValue + getFinalTime(segment.overallBest[this.timing]),
                0
            );
        }

        return null;
    }
}
</script>

<style lang="scss" scoped>
.summary-of-best {
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
