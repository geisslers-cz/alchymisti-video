<script module lang="ts">
  import { VideoFile } from '../../state/video';

  type Props = {
    onready?: () => void;
  };
</script>

<script lang="ts">
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { usePlayer } from '../../state/video';
  import { Button } from '../button';
  import { SortableItem, SortableList } from '../sortable';
  import AddFiles from './add-files.svelte';
  import Dropzone from './dropzone.svelte';
  import Video from './video.svelte';

  const player = usePlayer();

  let { onready }: Props = $props();
  let items: VideoFile[] = $derived([...player.files]);

  function get(): VideoFile[] {
    return [...player.files];
  }

  function set(items: VideoFile[]): void {
    player.setOrder(items);
  }
</script>

<Dropzone />

<div class="flex grow flex-col items-center gap-4 py-8">
  {#if player.files.size}
    <div class="flex flex-col gap-2">
      <SortableList bind:items={get, set} class="grid grid-cols-5 gap-2">
        {#each items as file (file.id)}
          <SortableItem id={file.id}>
            <Video {file} />
          </SortableItem>
        {/each}
      </SortableList>
      <div class="grid grid-cols-5 gap-2">
        <div class="w-52 p-2 text-center text-2xl">Vladimír</div>
        <div class="w-52 p-2 text-center text-2xl">Radim</div>
        <div class="w-52 p-2 text-center text-2xl">Dáša</div>
        <div class="w-52 p-2 text-center text-2xl">Vlasta</div>
        <div class="w-52 p-2 text-center text-2xl">Vašek</div>
      </div>
    </div>
  {/if}

  {#if player.files.size < 5}
    <AddFiles class={['grow self-stretch', !player.files.size && 'text-2xl']}>
      Click here or drag files into this window to add videos
    </AddFiles>
  {:else}
    <Button variant={['border', 'bg']} class="my-auto px-4 text-2xl" onclick={onready}>
      Next
      <ArrowRightIcon class="size-6" />
    </Button>
  {/if}
</div>
