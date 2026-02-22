<script module lang="ts">
  import { VideoFile } from '../../state/video';

  type Props = {
    onready?: () => void;
  };
</script>

<script lang="ts">
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { SortableList, sortItems } from '@rodrigodagostino/svelte-sortable-list';
  import { usePlayer } from '../../state/video';
  import { Button } from '../button';
  import AddFiles from './add-files.svelte';
  import Dropzone from './dropzone.svelte';
  import Video from './video.svelte';

  const player = usePlayer();

  let { onready }: Props = $props();
  let items: VideoFile[] = $derived([...player.files]);

  function ondragend({
    isCanceled,
    targetItemIndex: dstIdx,
    draggedItemIndex: srcIdx,
  }: SortableList.RootEvents['ondragend']): void {
    if (isCanceled || typeof dstIdx !== 'number' || dstIdx === srcIdx) {
      return;
    }

    player.setOrder(sortItems(items, srcIdx, dstIdx));
  }
</script>

<Dropzone />

<div class="flex grow flex-col items-center gap-4 py-8">
  {#if player.files.size}
    <div class="flex flex-col gap-2">
      <SortableList.Root
        direction="horizontal"
        canClearOnDragOut
        {ondragend}
        class="justify-start"
        gap={8}
      >
        {#each items as file, index (file.id)}
          <SortableList.Item
            class="[[data-is-ghost=false]]:[[data-drag-state*='ptr-drag']]:opacity-0"
            id={file.id}
            {index}
          >
            <Video {file} />
          </SortableList.Item>
        {/each}
      </SortableList.Root>

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
