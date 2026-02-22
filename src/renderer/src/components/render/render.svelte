<script module lang="ts">
  import { RenderState } from '../../state/video';

  type Props = {
    render: RenderState;
    onback?: () => void;
  };
</script>

<script lang="ts">
  import { usePlayer } from '../../state/video';
  import { Button } from '../button';

  const player = usePlayer();
  let { render, onback }: Props = $props();
</script>

<div class="m-auto flex flex-col items-center justify-center gap-2">
  {#if !render.done}
    <h2 class="pb-1 pl-2 text-center text-2xl">Rendering...</h2>
    <progress value={render.progress} class="w-md overflow-hidden rounded-full border"></progress>
    <p class="text-center">
      {render.time}
    </p>
    <Button variant={['bg', 'danger']} onclick={() => render.abort()} class="px-4">Abort</Button>
  {:else}
    <h2 class={['text-center text-2xl', render.ok ? 'text-green-500' : 'text-red-500']}>
      {#if render.ok}
        Render successful
      {:else}
        {render.message ?? 'Render error'}
      {/if}
    </h2>
    <Button variant="bg" onclick={onback} class="px-4">Back</Button>
  {/if}
</div>
