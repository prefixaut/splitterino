<template>
    <div class="segment-editor">
        <spl-text-input v-model="segment.name" outline="false" />
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Model } from 'vue-property-decorator';

import { Segment } from '../common/segment';

@Component
export default class SegmentEditorComponent extends Vue {
    @Prop(Object)
    @Model('change')
    public segment: Segment;
}
</script>
