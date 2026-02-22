<script module lang="ts">
  type Props = {
    onback?: () => void;
    onrender?: () => void;
  };
</script>

<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { usePlayer } from '../../state/video';
  import { Button } from '../button';
  import BtnPause from './btn-pause.svelte';
  import BtnPlay from './btn-play.svelte';
  import BtnStop from './btn-stop.svelte';
  import FollowMode from './follow-mode.svelte';
  import Time from './time.svelte';

  const player = usePlayer();

  let { onback, onrender }: Props = $props();
</script>

<div class="grid grid-cols-[1fr_max-content_1fr] items-center gap-4 p-2">
  <div class="flex items-center gap-2">
    <Button variant="bg" class="px-4" onclick={onback}>
      <ArrowLeftIcon class="size-4" />
      Back
    </Button>
    <FollowMode class="ml-auto" />
  </div>
  <div class="flex items-center justify-center gap-2">
    <BtnPlay />
    <BtnPause />
    <BtnStop />
  </div>
  <div class="flex items-center gap-2">
    <Time />
    <Button
      variant={['border', 'danger', 'bg']}
      class="ml-auto px-4"
      onclick={onrender}
      disabled={!player.canRender}
    >
      Render
      <ArrowRightIcon class="size-4" />
    </Button>
  </div>
</div>
