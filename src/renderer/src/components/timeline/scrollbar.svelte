<script module lang="ts">
</script>

<script lang="ts">
  import { on } from 'svelte/events';
  import { usePlayer } from '../../state/video';
  import { useView } from './provider.svelte';

  const player = usePlayer();
  const view = useView();

  let container: HTMLButtonElement | null = $state(null);
  let timelineDuration = $derived(player.timelineEnd - player.timelineStart);
  let width = $derived((view.width * view.duration) / timelineDuration);
  let left = $derived((view.width * (view.start - player.timelineStart)) / timelineDuration);
  let dragging = $state(false);

  function onpointerdown(evt: PointerEvent): void {
    if (!container || evt.defaultPrevented) {
      return;
    }

    evt.preventDefault();

    const btn =
      evt.target instanceof Element && evt.target.closest('span')?.getBoundingClientRect();
    const offset = btn ? evt.clientX - (btn.left + btn.width / 2) : 0;
    const rect = container.getBoundingClientRect();
    const minX = offset + rect.left + width / 2;
    const maxX = offset + rect.left + rect.width - width / 2;
    const off: (() => void)[] = [];
    view.suppressFollow = true;
    dragging = true;
    updateStart(evt);

    off.push(on(document, 'pointermove', updateStart));
    off.push(
      on(document, 'pointerup', (evt) => {
        off.forEach((cb) => cb());
        dragging = false;
        updateStart(evt);
      }),
    );

    function updateStart(evt: PointerEvent): void {
      const x = Math.max(minX, Math.min(maxX, evt.clientX));
      const pct = (x - minX) / (maxX - minX);
      view.start = pct * (timelineDuration - view.duration) + player.timelineStart;
    }
  }
</script>

<button
  bind:this={container}
  type="button"
  aria-label="Scrollbar"
  class="group relative z-50 block shrink-0 cursor-pointer py-0.5"
  {onpointerdown}
>
  <span
    class={[
      'ml-[calc(var(--left)*1px)] block h-2.5 w-[calc(var(--width)*1px)]',
      'rounded-full bg-black/35 group-hover:bg-black/50 data-[dragging=true]:bg-black/80',
    ]}
    style:--left={left}
    style:--width={width}
    data-dragging={dragging}
  ></span>
</button>
