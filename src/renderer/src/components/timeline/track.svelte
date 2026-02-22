<script module lang="ts">
  import { VideoFile } from '../../state/video';

  type Props = {
    file: VideoFile;
  };
</script>

<script lang="ts">
  import Region from './region.svelte';

  let { file }: Props = $props();
</script>

<div class="relative z-20 grow">
  {#if !file.peaks.resolved}
    {@render message('Loading audio...')}
  {:else if file.peaks.error}
    {@render message('Error loading file!')}
  {:else if !file.detectedOffset.resolved}
    {@render message('Analysing...')}
  {:else if file.detectedOffset.error}
    {@render message('Error analysing file!')}
  {/if}
  <Region {file} />
</div>

{#snippet message(text: string)}
  <div
    class="absolute -top-0.5 -bottom-0.5 left-0 z-10 flex w-full items-center justify-center bg-black/30 text-white"
  >
    {text}
  </div>
{/snippet}
