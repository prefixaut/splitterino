<template>
    <div class="splits-editor">
        <h1 class="title">Splits Editor</h1>

        <draggable class="segment-list" v-model="segments" :options="{ draggable: '.segment', scroll: true, scrollSensitivity: 80 }" @start="dragStart" @end="dragEnd">
            <!--transition-group-->
                <div
                    class="segment"
                    v-for="(segment, index) in segments"
                    :class="{ focused: index === focusedIndex, dragging: index === draggingIndex }"
                    :key="index">

                    <div class="drag-handle">
                        <icon>drag_handle</icon>
                    </div>

                    <div class="content">
                        <div class="name">
                            <input @value="segment.name" @input="formChange(index, 'name', $event)" @focus="setFocus(index)" @blur="removeFocus" />
                        </div>

                        <spl-time-input
                            class="time pb"
                            label="Personal Best"
                            :value="segment.personalBest"
                            @change="segment.personalBest = $event"
                            @focus="setFocus(index)"
                            @blur="removeFocus"
                        />

                        <spl-time-input
                            class="time ob"
                            label="Overall Best"
                            :value="segment.overallBest"
                            @change="segment.overallBest = $event"
                            @focus="setFocus(index)"
                            @blur="removeFocus"
                        />
                    </div>

                    <div class="delete-trigger" @click="remove(index)">
                        <icon>delete</icon>
                    </div>
                </div>
            <!--/transition-group-->
        </draggable>

        <div class="footer">
            <ui-button color="green" size="small" class="new-button" @click="add">New Segment</ui-button>
            <ui-button color="primary" size="small" class="save-button" @click="save">Save</ui-button>
            <ui-button color="default" size="small" class="load-button" @click="loadSplits">Load ...</ui-button>
        </div>
    </div>
</template>

<script>
export default {
    created() {
        this.segments = this.$store.state.Segments.elements.map(
            (value, index) => Object.assign({ index: index }, value)
        );
    },
    data() {
        return {
            // If the contents of the form has changed yet
            dirty: false,
            segments: [],
            draggingIndex: -1,
            focusedIndex: -1
        };
    },
    methods: {
        formChange(index, field, content) {
            if (this.segments.length <= index || index < 0) {
                return false;
            }
            const segment = this.segments[index];
            if (segment == null) {
                return false;
            }
            this.dirty = true;
            segment[field] = content;
        },
        dragStart(event) {
            this.draggingIndex = event.oldIndex;
        },
        dragEnd(event) {
            this.draggingIndex = -1;
        },
        setFocus(index) {
            this.focusedIndex = index;
        },
        removeFocus() {
            this.focusedIndex = -1;
        },
        add() {
            this.segments.push({ name: 'New Segment' });
            // TODO: Implement Scroll-To bottom (to the new segment)
            // window.scrollTo(document.body.scrollHeight);
        },
        remove(index) {
            this.segments.splice(index, 1);
        },
        save() {
            this.$store.commit('Segments/updateAllSegments', this.segments);
        }
    }
};
</script>

<style lang="scss">
@import '../styles/config';

.splits-editor {
    position: relative;
    display: block;

    .title {
        padding: 0 15px;
    }

    .detail-toggle {
        position: absolute;
        right: 15px;
        top: 15px;
    }

    .segment-list {
        width: 100%;
        list-style: none;
        padding: 10px 0;
        box-sizing: border-box;
    }

    .segment {
        width: 100%;
        list-style: none;
        border-bottom: 1px solid $color-white;
        padding: 10px;
        box-sizing: border-box;
        display: flex;
        flex-wrap: nowrap;
        flex-direction: row;
        align-items: center;
        -webkit-user-drag: none;

        .drag-handle {
            width: 24px;
            height: 24px;
            padding: 5px;
            flex: 0 0 auto;
            box-sizing: content-box;
            align-self: center;
            text-align: center;
            transition: 0.3s;
            cursor: pointer;
            -webkit-user-drag: element;
        }

        .content {
            flex: 1 1 auto;
            display: flex;

            .time {
                width: auto;
                flex: 1 1 25%;
            }
        }

        .delete-trigger {
            width: 24px;
            height: 24px;
            padding: 5px;
            flex: 0 0 auto;
            box-sizing: content-box;
            align-self: center;
            text-align: center;
            transition: 0.3s;
            cursor: pointer;

            &:hover {
                background: $color-alert;
            }
        }

        .name {
            width: 50%;

            input {
                height: 100%;
                width: 100%;
                padding: 5px 15px;
                box-sizing: border-box;
                border: 0;
                background: transparent;
                color: $color-white;
                text-align: center;
            }
        }

        .details {
            display: flex;
            width: 100%;
            flex-wrap: wrap;
            flex-direction: row;
            justify-content: center;

            .min-6 {
                min-width: 50%;
                flex: 1 1 auto;
                padding: 0 15px;
                box-sizing: border-box;
            }
        }

        &.focused,
        &:hover {
            &,
            & .number-input input {
                background: $color-mid-gray;
            }
        }

        &.dragging {
            background: $color-primary;

            &,
            & .number-input input {
                background: $color-primary;
            }
        }

        &:last-child {
            border-bottom: none;
        }
    }

    .footer {
        position: sticky;
        background: $color-mid-gray;
        bottom: 0;
    }

    .new-button {
        border-color: $color-success;

        &:hover {
            border-color: darken($color-success, 10%);
        }
    }

    .new-button,
    .save-button {
        margin: 10px 15px;
    }
}
</style>
