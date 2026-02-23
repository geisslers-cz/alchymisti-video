<script module lang="ts">
  import { VideoFile } from '../../state/video';

  type Props = {
    file: VideoFile;
  };
</script>

<script lang="ts">
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import RotateCwIcon from '@lucide/svelte/icons/rotate-cw';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import type { Component } from 'svelte';
  import { usePlayer } from '../../state/video';
  import { Button } from '../button';

  const player = usePlayer();
  let { file }: Props = $props();
</script>

<div class="relative flex flex-col gap-2">
  <div
    data-sortable-handle
    class={[
      'relative aspect-9/16 w-52 cursor-grab bg-black/10 select-none',
      'after:absolute after:top-0 after:left-0 after:size-full',
    ]}
  >
    <img
      src={file.thumb}
      alt={file.name}
      class={[
        'absolute top-1/2 left-1/2 block -translate-1/2',
        'max-h-none max-w-none rotate-[calc(var(--rotate)*1deg)] object-cover',
        file.rotate % 180 ? 'aspect-16/9 h-52' : 'aspect-9/16 w-52',
        !file.thumb && 'opacity-0',
      ]}
      style:--rotate={file.rotate}
    />
  </div>
  <div class="absolute bottom-0 left-0 flex w-full items-center justify-center gap-2 bg-black/50">
    {@render rotate(RotateCcwIcon, 'Rotate counter-clockwise', file, -90)}
    <Button variant="danger" class="p-1" title="Remove file" onclick={() => player.remove(file)}>
      <Trash2Icon class="size-5" />
    </Button>
    {@render rotate(RotateCwIcon, 'Rotate clockwise', file, 90)}
  </div>
</div>

{#snippet rotate(Icon: Component, title: string, file: VideoFile, a: number)}
  <Button
    class="p-1 disabled:hidden"
    {title}
    onclick={() => (file.rotate = (file.rotate + 360 + a) % 360)}
    disabled={!file.meta}
  >
    <Icon class="size-5" />
  </Button>
{/snippet}
