<script lang="ts">
  import { usePlayer } from '../../state/video';
  import Track from './track.svelte';

  const player = usePlayer();
</script>

<div class="grid w-32 shrink-0 grid-rows-5 gap-px pt-5.5 pb-4">
  {#each player.files as file (file)}
    <Track {file} />
  {/each}
</div>
