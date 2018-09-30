<template>
  <div class="ctx-menu-container" :style="pos">
      <ul class="ctx-menu">
          <li v-for="(menu, index) of ctxMenu" :key="index" class="ctx-menu-item" @click="executeActions(menu.actions)">{{ menu.text }}</li>
      </ul>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component({})
export default class ContextMenu extends Vue {
    @Prop()
    private menus: String[];
    @Prop()
    private x: number;
    @Prop()
    private y: number;
    private pos = {
        left: '0',
        top: '0'
    };

    private get ctxMenu() {
        return this.$store.getters['splitterino/contextMenu/ctxMenu'](
            this.menus
        );
    }

    private mounted() {
        // + 5 is a workaround to avoid squashing the context menu
        // TODO: Maybe find a better solution instead of adding a constant value
        const overflowWidth =
            this.x + this.$el.offsetWidth + 5 - window.innerWidth;
        overflowWidth > 0
            ? (this.pos.left = this.x - overflowWidth + 'px')
            : (this.pos.left = this.x + 'px');
        this.y + this.$el.offsetHeight >= window.innerHeight
            ? (this.pos.top = this.y - this.$el.offsetHeight + 'px')
            : (this.pos.top = this.y + 'px');
    }

    private executeActions(actions: Function[]) {
        actions.forEach(el => {
            el(this);
        });
    }
}
</script>

<style lang="scss">
.ctx-menu-container {
    background-color: white;
    position: absolute;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5);
    border-radius: 5px;
    -webkit-user-select: none;
    & > .ctx-menu {
        list-style: none;
        padding: 0;
        margin: 5px 0;
        & > .ctx-menu-item {
            text-align: left;
            padding: 3px 5px;
            &:hover {
                background-color: rgba(0, 0, 0, 0.3);
            }
        }
    }
}
</style>
