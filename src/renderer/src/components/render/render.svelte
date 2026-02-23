<script module lang="ts">
  import { RenderState } from '../../state/video';

  type Props = {
    render: RenderState;
    onback?: () => void;
  };
</script>

<script lang="ts">
  import { Button } from '../button';
  import { Time } from '../time';

  let { render, onback }: Props = $props();
</script>

<div class="m-auto flex flex-col items-center justify-center gap-2">
  {#if !render.done}
    <h2 class="pb-1 pl-2 text-center text-2xl">Rendering...</h2>
    <progress value={render.progress} class="w-md overflow-hidden rounded-full border"></progress>
    <div class="grid grid-cols-3 gap-4">
      <p class="text-center">
        <small class="block text-xs text-neutral-400">Current time:</small>
        <Time time={render.currentTime} />
        <span class="text-neutral-400">/</span>
        <Time time={render.duration} />
      </p>
      <p class="text-center">
        <small class="block text-xs text-neutral-400">Elapsed:</small>
        <Time time={render.elapsed} />
      </p>
      <p class="text-center">
        <small class="block text-xs text-neutral-400">ETA:</small>
        {#if render.eta !== undefined}
          <Time time={render.eta} />
        {:else}
          &mdash;
        {/if}
      </p>
    </div>
    <Button variant={['bg', 'danger']} onclick={() => render.abort()} class="px-4">Abort</Button>
  {:else}
    <h2 class={['text-center text-2xl', render.ok ? 'text-green-500' : 'text-red-500']}>
      {#if render.ok}
        Render successful
      {:else}
        {render.message ?? 'Render error'}
      {/if}
    </h2>
    <p class="text-center">
      <small class="block text-xs text-neutral-400">Total time elapsed:</small>
      <Time time={render.elapsed} />
    </p>
    <Button variant="bg" onclick={onback} class="px-4">Back</Button>
  {/if}
</div>
