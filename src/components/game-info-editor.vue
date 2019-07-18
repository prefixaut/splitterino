<template>
    <div class="game-info-editor">
        <div class="row">
            <spl-text-input
                label="Name"
                class="size-6"
                :value="name"
                @change="updateName($event)"
            />
            <spl-text-input
                label="Category"
                class="size-6"
                :value="category"
                @change="updateCategory($event)"
            />
        </div>

        <div class="row">
            <div class="size-4">
                <span>Language</span>
                <vue-select
                    label="name"
                    class="outline"
                    :value="language"
                    :options="allLanguages"
                    @change="updateLanguage($event)"
                />
            </div>
            <spl-text-input
                label="Platform"
                class="size-4"
                :value="platform"
                @change="updatePlatform($event)"
            />
            <div class="size-4">
                <span>Region</span>
                <vue-select
                    label="name"
                    class="outline"
                    :value="region"
                    :options="allRegions"
                    @change="updateRegion($event)"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import ISO6391 from 'iso-639-1';

import { RootState } from '../store/states/root.state';
import { Region, GameInfoState } from '../store/states/game-info.state';
import {
    ACTION_SET_GAME_NAME,
    ACTION_SET_CATEGORY,
    ACTION_SET_LANGUAGE,
    ACTION_SET_PLATFORM,
    ACTION_SET_REGION
} from '../store/modules/game-info.module';

interface SingleLanguage {
    code: string;
    name: string;
    nativeName: string;
}

@Component({ name: 'spl-game-info-editor' })
export default class GameInfoEditorComponent extends Vue {

    @Prop()
    public value: GameInfoState;

    public name: string = null;
    public category: string = null;
    public language: SingleLanguage = null;
    public platform: string = null;
    public region: { name: string; id: Region } = null;

    public allLanguages: SingleLanguage[];
    public allRegions: { name: string; id: Region }[] = [
        { id: Region.PAL_EUR, name: 'PAL Europe' },
        { id: Region.PAL_CHN, name: 'PAL China' },
        { id: Region.PAL_BRA, name: 'PAL Brazil' },
        { id: Region.NTSC_USA, name: 'NTSC North America' },
        { id: Region.NTSC_JPN, name: 'NTSC Japan' },
    ];

    created() {
        this.allLanguages = ISO6391.getLanguages(ISO6391.getAllCodes());
    }

    public updateName(name: string) {
        this.name = name;
        this.sendChange();
    }

    public updateCategory(category: string) {
        this.category = category;
        this.sendChange();
    }

    public updateLanguage(language) {
        this.language = language;
        this.sendChange();
    }

    public updatePlatform(platform: string) {
        this.platform = platform;
        this.sendChange();
    }

    public updateRegion(region) {
        this.region = region;
        this.sendChange();
    }

    public sendChange() {
        this.$emit('change', {
            name: this.name,
            category: this.category,
            language: this.language != null ? this.language.code : null,
            platform: this.platform,
            region: this.region != null ? this.region.id : null,
        });
    }

    @Watch('value', { immediate: true, deep: true })
    public onValuePropChange(state: GameInfoState) {
        this.name = state.name;
        this.category = state.category;
        const tmp = ISO6391.getLanguages([state.language])[0];
        this.language = tmp != null ? tmp : null;
        this.platform = state.platform;
        this.region = this.allRegions.find(region => region.id === state.region);
    }
}
</script>

<style lang="scss" scoped>
.game-info-editor {
    .row {
        display: flex;
        flex-wrap: wrap;
        margin: 0 10px;
    }

    .size-6 {
        flex: 0 1 50%;
        min-width: 50%;
        max-width: 50%;
        padding: 0 10px;
        margin-top: 10px;
    }

    .size-4 {
        flex: 1 1 auto;
        min-width: auto;
        max-width: auto;
        padding: 0 10px;
        margin-top: 10px;
    }
}
</style>

