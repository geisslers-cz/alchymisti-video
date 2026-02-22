<script lang="ts">
  import PlayIcon from '@lucide/svelte/icons/play';
  import { PlaybackState, usePlayer } from '../../state/video';
  import { Button } from '../button';

  const player = usePlayer();
</script>

<Button
  variant={['border', 'bg-inv', 'success']}
  title="Play"
  data-active={player.playbackState !== PlaybackState.Stopped}
  onclick={() => player.play()}
>
  <PlayIcon class="size-4" />
</Button>
