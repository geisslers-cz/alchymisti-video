<script lang="ts">
  import PauseIcon from '@lucide/svelte/icons/pause';
  import { PlaybackState, usePlayer } from '../../state/video';
  import { Button } from '../button';

  const player = usePlayer();
</script>

<Button
  variant={['border', 'bg-inv']}
  title="Pause"
  data-active={player.playbackState === PlaybackState.Paused}
  onclick={() => player.pause()}
>
  <PauseIcon class="size-4" />
</Button>
