<template>
    <div class="open-template-view" v-spl-ctx-menu="['def']">
        <spl-open-template-prompt/>
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

