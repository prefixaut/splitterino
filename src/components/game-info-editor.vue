<template>
    <div class="game-info-editor">
        <div class="row">
            <spl-text-input v-model="name" label="Name" class="size-6" />
            <spl-text-input v-model="category" label="Category" class="size-6" />
        </div>

        <div class="row">
            <div class="size-4">
                <span>Language</span>
                <vue-select v-model="language" :options="allLanguages" label="name" class="outline" />
            </div>
            <spl-text-input v-model="platform" label="Platform" class="size-4" />
            <div class="size-4">
                <span>Region</span>
                <vue-select v-model="region" :options="allRegions" label="name" class="outline" />
            </div>
        </div>

        <spl-button theme="info" outline @click="saveContent()">Save Infos</spl-button>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import ISO6391 from 'iso-639-1';

import { RootState } from '../store/states/root.state';
import { Region } from '../store/states/game-info.state';
import { ACTION_SET_GAME_NAME, ACTION_SET_CATEGORY, ACTION_SET_LANGUAGE, ACTION_SET_PLATFORM, ACTION_SET_REGION } from '../store/modules/game-info.module';

interface SingleLanguage {
    code: string;
    name: string;
    nativeName: string;
}

@Component({ name: 'spl-game-info-editor' })
export default class GameInfoEditorComponent extends Vue {
    public name: string = null;
    public category: string = null;
    public language: SingleLanguage = null;
    public platform: string = null;
    public region: Region = null;

    public allLanguages: SingleLanguage[];
    public allRegions: { name: string; id: Region }[];

    created() {
        const state = (this.$store.state as RootState).splitterino.gameInfo;
        this.name = state.name;
        this.category = state.category;
        const tmp = ISO6391.getLanguages([state.language])[0];
        this.language = tmp != null ? tmp : null;
        this.platform = state.platform;
        this.region = state.region;

        this.allLanguages = ISO6391.getLanguages(ISO6391.getAllCodes());
        this.allRegions = [
            { id: Region.PAL_EUR, name: 'PAL Europe' },
            { id: Region.PAL_CHN, name: 'PAL China' },
            { id: Region.PAL_BRA, name: 'PAL Brazil' },
            { id: Region.NTSC_USA, name: 'NTSC North America' },
            { id: Region.NTSC_JPN, name: 'NTSC Japan' },
        ];
    }

    saveContent() {
        this.$store.dispatch(ACTION_SET_GAME_NAME, this.name);
        this.$store.dispatch(ACTION_SET_CATEGORY, this.category);
        this.$store.dispatch(ACTION_SET_LANGUAGE, this.language != null ? this.language.code : null);
        this.$store.dispatch(ACTION_SET_PLATFORM, this.platform);
        this.$store.dispatch(ACTION_SET_REGION, this.region);
    }
}
</script>

<style lang="scss" scoped>
.game-info-editor {
    .row {
        display: flex;
        margin: 10px 0;
    }

    .size-6 {
        flex: 0 1 50%;
        min-width: 50%;
        max-width: 50%;
        padding: 0 10px;
    }

    .size-4 {
        flex: 0 1 33%;
        min-width: 33%;
        max-width: 33%;
        padding: 0 10px;
    }
}
</style>

