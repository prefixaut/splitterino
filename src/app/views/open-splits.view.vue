<template>
    <div v-spl-ctx-menu="['def']" class="open-splits-view">
        <spl-open-splits-prompt />
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({ name: 'spl-open-splits-view' })
export default class OpenSplitsView extends Vue {
}
</script>

<style lang="scss" scoped>
.open-splits-view {
    height: 100%;
}
</style>

