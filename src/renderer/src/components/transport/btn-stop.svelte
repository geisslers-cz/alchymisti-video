<script lang="ts">
  import SquareIcon from '@lucide/svelte/icons/square';
  import { usePlayer } from '../../state/video';
  import { Button } from '../button';

  const player = usePlayer();
</script>

<Button variant={['border', 'bg-inv']} title="Stop" onclick={() => player.stop()}>
  <SquareIcon class="size-4" />
</Button>
