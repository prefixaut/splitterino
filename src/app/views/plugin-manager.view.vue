<template>
    <div v-spl-ctx-menu="['def']" class="plugin-manager-view">
        <spl-plugin-manager />
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({ name: 'spl-plugin-manager-view' })
export default class PluginManagerView extends Vue {

}
</script>

<style lang="scss" scoped>

</style>
