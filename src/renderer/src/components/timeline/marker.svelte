<script module lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from '../../utils';

  const alignments = {
    left: 'left-0',
    center: 'left-0 -translate-x-1/2',
    right: 'right-0',
  } as const;

  type Props = {
    time: number;
    title?: string;
    align?: keyof typeof alignments;
    class?: ClassValue;
    children?: Snippet;
  };
</script>

<script lang="ts">
  import { on } from 'svelte/events';
  import { PlaybackState, usePlayer } from '../../state/video';
  import { cn } from '../../utils';
  import { useView } from './provider.svelte';

  const player = usePlayer();
  const view = useView();

  let { time = $bindable(), title, align = 'center', class: className, children }: Props = $props();
  let left = $derived((time - view.start) * view.pxPerSec);
  let dragging = $state(false);

  function onpointerdown(evt: PointerEvent): void {
    evt.preventDefault();

    const t0 = time;
    const x0 = evt.clientX;
    const off: (() => void)[] = [];
    dragging = true;
    view.suppressFollow = player.playbackState === PlaybackState.Playing;

    off.push(
      on(document, 'pointermove', (evt) => {
        time = Math.round(t0 + (evt.clientX - x0) / view.pxPerSec);
      }),
    );

    off.push(
      on(document, 'pointerup', (evt) => {
        off.forEach((cb) => cb());
        dragging = false;

        if (evt.clientX === x0) {
          player.seekTo(t0);
        }
      }),
    );
  }
</script>

{#if dragging || (time >= view.start && time <= view.start + view.duration)}
  <button
    type="button"
    {title}
    {onpointerdown}
    class={cn(
      'absolute top-0 left-[calc(var(--left)*1px)] z-50 h-full w-0 cursor-pointer border-l text-xs',
      className,
    )}
    style:--left={left}
  >
    <span class={['absolute top-0 bg-current px-1 py-0.5', alignments[align]]}>
      <span class="text-neutral-50">
        {@render children?.()}
      </span>
    </span>
  </button>
{/if}
