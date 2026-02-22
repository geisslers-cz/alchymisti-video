<script module lang="ts">
  import { createContext } from 'svelte';
  import { ViewContext } from './view.svelte';

  const [useView, createViewContext] = createContext<ViewContext>();

  export { useView };
</script>

<script lang="ts">
  import { usePlayer } from '../../state/video';

  let { children } = $props();

  const player = usePlayer();
  createViewContext(new ViewContext(player));
</script>

{@render children?.()}
