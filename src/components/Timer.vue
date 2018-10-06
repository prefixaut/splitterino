<template>
    <div class="timer" :class="'status-' + status">
        <span class="content">{{ currentTime | aevum }}</span>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { TimerStatus } from '../common/timer-status';

const timer = namespace('splitterino/timer');

export default class Timer extends Vue {
    @timer.State('status')
    public status: TimerStatus;

    public currentTime = 0;

    private statusWatcher() {};

    created() {
        this.statusWatcher = this.$store.watch(state => state['spltitterino/timer'].status, this.statusChange);
    }

    destroy() {
        this.statusWatcher();
    }

    statusChange() {
        console.log('status changed');
    }
}
</script>
