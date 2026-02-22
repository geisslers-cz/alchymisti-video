<script module lang="ts">
  import { createContext } from 'svelte';
  import { Player } from './player.svelte';

  const [usePlayer, createPlayerContext] = createContext<Player>();

  export { usePlayer };
</script>

<script lang="ts">
  import { PlaybackState } from './player.svelte';

  let { children } = $props();

  const player = createPlayerContext(new Player());

  function onkeydown(evt: KeyboardEvent): void {
    switch (evt.key) {
      case ' ':
        if (player.playbackState === PlaybackState.Playing) {
          player.stop();
        } else {
          player.play();
        }
        break;
      case 'Enter':
        if (player.playbackState === PlaybackState.Playing) {
          player.pause();
        } else {
          player.play();
        }
        break;
      case 'Escape':
        player.stop();
        break;
      default:
        return;
    }

    evt.preventDefault();
  }
</script>

<svelte:body {onkeydown} />

{@render children?.()}
