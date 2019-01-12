<template>
    <div class="default-view container">
        <spl-splits/>
        <spl-timer/>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class DefaultView extends Vue {}
</script>
