<script module lang="ts">
  import type { ClassValue } from '../../utils';

  type Props = {
    class?: ClassValue;
  };
</script>

<script lang="ts">
  import SquareCenterlineDashedHorizontalIcon from '@lucide/svelte/icons/square-centerline-dashed-horizontal';
  import { cn } from '../../utils';
  import { Button } from '../button';
  import { useView } from '../timeline';

  const view = useView();
  let { class: className }: Props = $props();
</script>

<Button
  variant={['border', 'bg']}
  title="Follow playback"
  data-active={view.followPlayback}
  class={cn('p-1.5 data-[active=true]:bg-black/50', className)}
  onclick={() => (view.followPlayback = !view.followPlayback)}
>
  <SquareCenterlineDashedHorizontalIcon class="size-3" />
</Button>
