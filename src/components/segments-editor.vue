<template>
    <div class="segments-editor">
        <table class="segments">
            <thead slot="header">
                <tr>
                    <th class="handle"><!-- Drag-Handle --></th>
                    <th class="name">Name</th>
                    <th class="small-description"><!-- leave empty --></th>
                    <th class="personal-best">Personal Best</th>
                    <th class="overall-best">Overall Best</th>
                    <th class="manage"><!-- Management --></th>
                </tr>
            </thead>

            <draggable
                element="tbody"
                draggable=".segment-row"
                handle=".handle"
                direction="horizontal"
                v-model="segments"
                @change="triggerSegmentsChange()"
            >
                <tr class="segment-row" v-for="(segment, index) of segments" :key="segment.id">
                    <td class="handle">
                        <fa-icon icon="grip-lines" />
                    </td>
                    <td class="name">
                        <spl-text-input
                            v-model="segment.name"
                            :required="false"
                            :minlength="1"
                            @change="triggerSegmentsChange()"
                        />
                    </td>
                    <td class="small-description">
                        <p>PB</p>
                        <p>OB</p>
                    </td>
                    <td class="personal-best">
                        <spl-time-input
                            v-model="segment.personalBest[timing].rawTime"
                            @change="triggerSegmentsChange()"
                            @blur="validateSegmentChange(index)"
                        />
                    </td>
                    <td class="overall-best">
                        <spl-time-input
                            v-model="segment.overallBest[timing].rawTime"
                            @change="triggerSegmentsChange()"
                            @blur="validateSegmentChange(index)"
                        />
                    </td>
                    <td class="manage">
                        <button class="remove-segment" title="Remove Segment" @click="removeSegment(index)">
                            <fa-icon icon="trash-alt" />
                        </button>
                    </td>
                </tr>
            </draggable>

            <tfoot slot="footer">
                <tr class="add-new">
                    <td colspan="9999">
                        <spl-button class="add-new-segment" theme="primary" outline @click="addSegment()">
                            <fa-icon icon="plus" />
                            <span>&nbsp;Add new Segment</span>
                        </spl-button>
                    </td>
                </tr>
            </tfoot>
        </table>
    </div>
</template>

<script lang="ts">
import { cloneDeep } from 'lodash';
import { v4 as uuid } from 'uuid';
import { Vue, Component, Prop, Watch, Emit } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

import { DEFAULT_SPLIT } from '../common/constants';
import { Segment, TimingMethod, getFinalTime } from '../common/interfaces/segment';
import { ValidatorService, VALIDATOR_SERVICE_TOKEN } from '../services/validator.service';

const splits = namespace('splitterino/splits');

@Component({ name: 'spl-segments-editor' })
export default class SegmentsEditorComponent extends Vue {

    @Prop({ default: () => [] })
    public value: Segment[];

    @splits.State('timing')
    public timing: TimingMethod;

    public segments: Segment[] = [];

    private validator: ValidatorService = null;

    public created() {
        this.validator = this.$services.get(VALIDATOR_SERVICE_TOKEN);
    }

    public addSegment() {
        this.segments.push({
            id: uuid(),
            ...DEFAULT_SPLIT,
        });
        this.triggerSegmentsChange();
    }

    public removeSegment(index: number) {
        this.segments.splice(index, 1);
        this.triggerSegmentsChange();
    }

    public validateSegmentChange(index: number) {
        const segment = this.segments[index];

        if (getFinalTime(segment.personalBest.rta) > 0 &&
            getFinalTime(segment.personalBest.rta) < getFinalTime(segment.overallBest.rta)) {
            segment.overallBest.rta = segment.personalBest.rta;
        }

        if (getFinalTime(segment.personalBest.igt) > 0 &&
            getFinalTime(segment.personalBest.igt) < getFinalTime(segment.overallBest.igt)) {
            segment.overallBest.igt = segment.personalBest.igt;
        }
    }

    @Emit('change')
    public triggerSegmentsChange() {
        return this.segments;
    }

    @Watch('value', { immediate: true, deep: true })
    public onValuePropChange(newValue: Segment[]) {
        if (!Array.isArray(newValue)) {
            newValue = [newValue];
        }
        this.segments = cloneDeep(newValue).map(value => ({
            ...DEFAULT_SPLIT,
            ...value,
        })).filter(tmp => this.validator.isSegment(tmp));
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core.scss';

.splits-editor {
    flex-shrink: 2;
    @media (min-height: 300px) {
        overflow: auto;
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
    min-height: 0;
}

.segment-row {
    > td {
        border-left: 5px solid transparent;

        &.name {
            min-width: 100px;
        }

        > .time-input {
            border: 1px solid $spl-color-very-light-gray;
            padding: 2px;
        }
    }

    .handle {
        padding: 5px 10px;
        margin-right: 5px;
        cursor: -webkit-grab;
        border: none;
    }

    .manage {
        padding: 5px 5px 5px 0;

        .remove-segment {
            border: 1px solid $spl-color-dark-gray;
            background: $spl-color-off-black;
            color: $spl-color-dark-danger;
            padding: 8px 13px;
            outline: none;
            transition: 200ms;
            cursor: pointer;

            &:active {
                border-color: $spl-color-danger;
                background: $spl-color-danger;
                color: $spl-color-off-black;
            }
        }
    }

    &.sortable-ghost {
        background: $spl-color-light-primary;

        > td {
            border-color: $spl-color-light-primary;
        }

        & >>> .text-input > input {
            background: $spl-color-light-primary;
            border-color: $spl-color-light-primary;
        }
    }
}

.small-description {
    display: none;
}

@media (max-width: 660px) {
    th.personal-best,
    th.overall-best {
        display: none;
    }

    td.personal-best,
    td.overall-best {
        display: block;
    }

    th.small-description {
        display: block;
    }

    td.small-description {
        display: table-cell;

        > * {
            margin-top: 16px;
        }

        :nth-child(1) {
            margin-top: 7px;
        }
    }

    td > .time-input {
        padding: 0 !important;
        border: none !important;
    }
}

.add-new-segment {
    display: block;
    margin: 10px auto;
}
</style>
