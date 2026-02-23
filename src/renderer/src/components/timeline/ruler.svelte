<script module lang="ts">
  const tickStepDurations = [5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000, 10000, 30000, 60000];
  const tickCount = 10;
</script>

<script lang="ts">
  import { usePlayer } from '../../state/video';
  import { formatTime } from '../../utils';
  import Marker from './marker.svelte';
  import { useView } from './provider.svelte';

  const view = useView();
  const player = usePlayer();
  let ruler: HTMLCanvasElement | null = $state(null);
  let playhead: HTMLCanvasElement | null = $state(null);
  let rulerCtx: CanvasRenderingContext2D | null = $derived(ruler?.getContext('2d') ?? null);
  let playheadCtx: CanvasRenderingContext2D | null = $derived(playhead?.getContext('2d') ?? null);
  let offsetHeight: number = $state(0);
  let [step, count] = $derived.by(() => {
    const viewMs = 1000 * view.duration;
    const step = tickStepDurations.find((step) => viewMs / step <= tickCount);
    return [step, Math.ceil(viewMs / step)];
  });

  let musicTime = $state(150);

  $effect(() => {
    if (!ruler || !rulerCtx) {
      return;
    }

    ruler.width = 2 * view.width;
    const h = (ruler.height = 2 * offsetHeight);

    rulerCtx.strokeStyle = 'oklch(70.8% 0 0)';
    rulerCtx.fillStyle = 'oklch(70.8% 0 0)';
    rulerCtx.lineWidth = 1;
    rulerCtx.font = '20px sans-serif';
    rulerCtx.textAlign = 'left';

    const t0 = step * Math.ceil((1000 * view.start) / step);

    for (let i = 0; i < count; ++i) {
      const t = Math.round(t0 + i * step);
      const x = (t / 1000 - view.start) * 2 * view.pxPerSec;
      rulerCtx.beginPath();
      rulerCtx.moveTo(x, 0);
      rulerCtx.lineTo(x, h);
      rulerCtx.stroke();

      const [int, dec] = formatTime(t);
      rulerCtx.fillText(int, x + 5, 27);

      if (step >= 1000) {
        const { width } = rulerCtx.measureText(int);
        rulerCtx.font = '14px sans-serif';
        rulerCtx.fillText('.' + dec, x + width + 6, 27);
        rulerCtx.font = '20px sans-serif';
      }
    }
  });

  $effect(() => {
    if (!playhead || !playheadCtx) {
      return;
    }

    playhead.width = 2 * view.width;
    const h = (playhead.height = 2 * offsetHeight);

    if (
      !player.files.size ||
      player.playhead < view.start ||
      player.playhead > view.start + view.duration
    ) {
      return;
    }

    const x = 2 * view.pxPerSec * (player.playhead - view.start);
    playheadCtx.strokeStyle = '#f00';
    playheadCtx.fillStyle = '#f00';
    playheadCtx.lineWidth = 2;
    playheadCtx.beginPath();
    playheadCtx.moveTo(x, 7);
    playheadCtx.lineTo(x - 7, 0);
    playheadCtx.lineTo(x + 7, 0);
    playheadCtx.lineTo(x, 7);
    playheadCtx.lineTo(x, h);
    playheadCtx.stroke();
    playheadCtx.fill();
  });
</script>

<canvas bind:offsetHeight bind:this={ruler} class="absolute top-0 left-0 h-full w-full"></canvas>
<canvas bind:offsetHeight bind:this={playhead} class="absolute top-0 left-0 h-full w-full"></canvas>

<Marker bind:time={player.renderStart} align="left" class="text-green-500">START</Marker>
<Marker bind:time={player.renderEnd} align="right" class="text-green-500">END</Marker>

<Marker bind:time={musicTime} align="left" class="text-blue-500">
  {@const [min] = formatTime((musicTime - player.renderStart) * 1000)}
  {min}
</Marker>
