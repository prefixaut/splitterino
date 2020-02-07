<template>
    <div v-spl-ctx-menu="['def']" class="open-template-view">
        <spl-open-template-prompt />
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({ name: 'spl-open-template-view' })
export default class OpenTemplate extends Vue {
}
</script>

<style lang="scss" scoped>
.open-template-view {
    height: 100%;
}
</style>

