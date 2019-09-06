<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { DEFAULT_TIMER_FORMAT } from '../common/constants';

@Component
export default class AevumFormatMixin extends Vue {
    @Prop({ type: String, default: DEFAULT_TIMER_FORMAT })
    public format: string;
}
</script>
