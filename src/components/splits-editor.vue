<template>
    <div class="splits-editor">
        <div class="header">
            <slot></slot>
        </div>

        <div class="content">
            <section id="segments">
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
                                />
                            </td>
                            <td class="small-description">
                                <p>PB</p>
                                <p>OB</p>
                            </td>
                            <td class="personal-best">
                                <spl-time-input v-model="segment.personalBest" />
                            </td>
                            <td class="overall-best">
                                <spl-time-input v-model="segment.overallBest" />
                            </td>
                            <td class="manage">
                                <button
                                    class="remove-segment"
                                    title="Remove Segment"
                                    @click="removeSegment(index)"
                                >
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
            </section>
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
import { v4 as uuid } from 'uuid';

import { Segment } from '../common/interfaces/segment';
import { ACTION_SET_ALL_SEGMENTS } from '../store/modules/splits.module';

const splits = namespace('splitterino/splits');

@Component({ name: 'spl-splits-editor' })
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
        return !isEqual(
            this.$store.state.splitterino.splits.segments,
            this.segments
        );
    }

    addSegment() {
        this.segments.push({
            id: uuid(),
            name: '',
        });
    }

    removeSegment(index: number) {
        this.segments.splice(index, 1);
    }

    saveSplits() {
        this.$store.dispatch(ACTION_SET_ALL_SEGMENTS, this.segments);
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
            border: 1px solid $spl-color-off-black;
            background: $spl-color-off-black;
            color: $spl-color-dark-danger;
            padding: 8px 13px;
            outline: none;
            transition: 200ms;

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
