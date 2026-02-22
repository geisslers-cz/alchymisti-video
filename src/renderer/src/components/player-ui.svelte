<script lang="ts">
  import { RenderState, usePlayer } from '../state/video';
  import { Render } from './render';
  import { Timeline } from './timeline';
  import { TrackList } from './track-list';
  import { TransportControls } from './transport';
  import { VideoSelector } from './video-selector';

  const player = usePlayer();
  let view: 'selector' | 'timeline' | 'render' = $state('selector');
  let render: RenderState | undefined = $state();
  let outputPath: string | undefined = $state();

  async function onrender(): Promise<void> {
    outputPath = await window.main.getSavePath([...player.files].map((file) => file.blob));

    if (!outputPath?.length) {
      return;
    }

    view = 'render';
    render = player.render(outputPath);
  }

  function go(to: 'selector' | 'timeline' | 'render'): () => void {
    return () => {
      render?.abort();
      render = undefined;
      view = to;
    };
  }
</script>

{#if view === 'selector'}
  <VideoSelector onready={go('timeline')} />
{:else if view === 'timeline'}
  <div class="flex grow gap-2">
    <TrackList />
    <Timeline />
  </div>
  <TransportControls onback={go('selector')} {onrender} />
{:else if render}
  <Render {render} onback={go('timeline')} />
{/if}
