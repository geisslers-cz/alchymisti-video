<script module lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from '../../utils';

  type Props = {
    class?: ClassValue;
    children?: Snippet;
  };
</script>

<script lang="ts">
  import { usePlayer } from '../../state/video';
  import { cn, touch } from '../../utils';

  const player = usePlayer();
  let { class: className, children }: Props = $props();
  let update = $state(Symbol());

  function get(): FileList {
    return touch(new DataTransfer().files, update);
  }

  function set(files: FileList): void {
    update = Symbol();

    for (const file of files) {
      if (/^video\/.+$/.test(file.type)) {
        player.add(file);
      }
    }
  }
</script>

<label
  class={cn(
    'relative flex cursor-pointer items-center justify-center',
    'text-neutral-400 hover:text-neutral-50',
    className,
  )}
>
  <input
    type="file"
    multiple
    accept="video/*"
    class="absolute bottom-full left-0 h-px w-px opacity-0"
    bind:files={get, set}
  />
  {@render children?.()}
</label>
