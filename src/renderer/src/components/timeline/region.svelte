<script module lang="ts">
  import { VideoFile } from '../../state/video';

  type Props = {
    file: VideoFile;
  };
</script>

<script lang="ts">
  import { on } from 'svelte/events';
  import { srate } from '../../state/video';
  import { cn } from '../../utils';
  import { useView } from './provider.svelte';

  const view = useView();
  let { file }: Props = $props();
  let canvas: HTMLCanvasElement | null = $state(null);
  let ctx: CanvasRenderingContext2D | null = $derived(canvas ? canvas.getContext('2d') : null);
  let offsetHeight: number = $state(0);
  let visible: boolean = $derived(
    file.duration > 0 &&
      file.playbackOffset < view.start + view.duration &&
      file.playbackOffset + file.duration > view.start,
  );
  let regionStart = $derived(Math.max(0, file.playbackOffset - view.start));
  let regionDuration = $derived(
    Math.min(view.start + view.duration, file.playbackOffset + file.duration) -
      view.start -
      regionStart,
  );
  let regionLeft = $derived(regionStart * view.pxPerSec - 1);
  let regionWidth = $derived(regionDuration * view.pxPerSec + 2);

  $effect(() => {
    if (!canvas || !ctx || !visible) {
      return;
    }

    const ptPerSec = 2 * view.pxPerSec;
    canvas.width = regionDuration * ptPerSec;
    const h = (canvas.height = offsetHeight * 2);

    if (!file.peaks.resolved || file.peaks.error) {
      return;
    }

    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';

    const peakCount = Math.round(regionDuration * ptPerSec);
    const peakStep = (srate * regionDuration) / peakCount;
    const peakStart =
      view.start > file.playbackOffset ? (view.start - file.playbackOffset) * srate : 0;

    ctx.beginPath();

    for (let x = 0; x < peakCount; ++x) {
      const v = file.peaks.result[Math.round(peakStart + x * peakStep)] / 64;
      const y = (1 + v) * (h / 2);

      if (x > 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.moveTo(x, y);
      }
    }

    ctx.strokeStyle = '#333';
    ctx.stroke();
  });

  function onpointerdown(evt: MouseEvent): void {
    const elem = evt.currentTarget;

    if (!(elem instanceof HTMLDivElement)) {
      return;
    }

    evt.preventDefault();

    const start = file.offset;
    const x0 = evt.clientX;
    const off: (() => void)[] = [];

    off.push(
      on(document, 'pointermove', (evt) => {
        file.offset = start + (evt.clientX - x0) / view.pxPerSec;
      }),
    );

    off.push(
      on(document, 'pointerup', () => {
        off.forEach((cb) => cb());
      }),
    );
  }
</script>

<div
  role="region"
  class={cn(
    'absolute top-0 left-[calc(var(--left)*1px)] h-full w-[calc(var(--width)*1px)]',
    'cursor-grab border-y border-neutral-400 bg-sky-400/50',
    regionLeft >= 0 && 'rounded-l border-l',
    regionLeft + regionWidth <= view.width && 'rounded-r border-r',
    !visible && 'hidden',
  )}
  style:--left={regionLeft}
  style:--width={regionWidth}
  bind:offsetHeight
  {onpointerdown}
>
  <canvas bind:this={canvas} class="block h-full w-full"></canvas>
</div>
