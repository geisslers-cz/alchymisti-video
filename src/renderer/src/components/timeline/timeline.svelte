<script lang="ts">
  import { on } from 'svelte/events';
  import { PlaybackState, usePlayer } from '../../state/video';
  import { useView } from './provider.svelte';
  import Ruler from './ruler.svelte';
  import Scrollbar from './scrollbar.svelte';
  import TimelineTrack from './track.svelte';

  const player = usePlayer();
  const view = useView();
  let container: HTMLDivElement | null = $state(null);
  let lastState = player.playbackState;
  let wasFollowing = view.followPlayback;

  $effect(() => {
    if (
      (player.playbackState !== lastState && player.playbackState === PlaybackState.Playing) ||
      (view.followPlayback && !wasFollowing)
    ) {
      view.suppressFollow = false;
    }

    lastState = player.playbackState;
    wasFollowing = view.followPlayback;
  });

  function onwheel(evt: WheelEvent): void {
    if (!container || !player.files.size) {
      return;
    }

    view.handleWheel(evt, mousePos(evt, container));
  }

  function onpointerdown(evt: PointerEvent): void {
    if (!container || !player.files.size || evt.defaultPrevented) {
      return;
    }

    const playing = player.playbackState === PlaybackState.Playing;
    const start = view.start;
    const rect = container.getBoundingClientRect();
    const off: (() => void)[] = [];

    view.suppressFollow = playing;
    updatePlayhead(evt);

    if (!playing) {
      off.push(on(document, 'pointermove', updatePlayhead));
    }

    off.push(
      on(document, 'pointerup', (upevt) => {
        off.forEach((cb) => cb());

        if (Math.abs(upevt.clientX - evt.clientX) > 10) {
          updatePlayhead(upevt);
        }
      }),
    );

    function updatePlayhead(evt: PointerEvent): void {
      player.seekTo(start + view.duration * mousePos(evt, container, rect));
    }
  }

  function mousePos(
    evt: PointerEvent | WheelEvent,
    container: HTMLDivElement,
    rect: DOMRect = container.getBoundingClientRect(),
  ): number {
    return (evt.clientX - rect.left) / rect.width;
  }
</script>

<div
  bind:this={container}
  bind:offsetWidth={view.width}
  role="application"
  class={[
    'relative flex grow flex-col pt-5',
    'before:absolute before:top-0 before:left-0 before:h-5 before:w-full before:bg-black/30',
    'after:absolute after:bottom-0 after:left-0 after:h-3.5 after:w-full after:bg-black/30',
    'cursor-text bg-neutral-600',
  ]}
  {onwheel}
  {onpointerdown}
>
  <Ruler />
  <div class="flex grow flex-col gap-1 py-1">
    {#each player.files as file (file)}
      <TimelineTrack {file} />
    {/each}
  </div>
  <Scrollbar />
</div>
