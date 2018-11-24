<template>
    <div class="timer">
        Timer: <span class="content">{{ currentTime | aevum }}</span>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { TimerStatus } from '../common/timer-status'
import { RootState } from '../store/states/root'
import { now } from '../utils/now'
const timer = namespace('splitterino/timer')
@Component(
    create d() 
        this.statusWatcher = this.$store.watch
            (state: RootState) => state.splitterino.timer.status
            this.statusChang
        )
    
}
export default class Timer extends Vue 
    @timer.State('status'
    public status: TimerStatus
    @timer.State('startDelay'
    public startDelay: number
    @timer.State('startTime'
    public startTime: number
    @timer.State('pauseTotal'
    public pauseTotal: number
    public currentTime = 0
    private intervalId = -1
    private statusWatche r() {
    public destro y() 
        this.statusWatcher()
    
    public statusChang e() 
        if (this.status === TimerStatus.RUNNING) 
            this.intervalId = window.setInterval(() => 
                this.currentTime 
                    now() - this.startTime - this.startDelay - this.pauseTotal
            }, 1)
            return
        
        if (this.intervalId > -1) 
            window.clearInterval(this.intervalId)
        
        if (this.status === TimerStatus.STOPPED) 
            this.currentTime = 0
        
    
}
</script>
