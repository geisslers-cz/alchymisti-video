<script module lang="ts">
  import type { ClassValue } from '../../utils';

  type Props = {
    class?: ClassValue;
  };
</script>

<script lang="ts">
  import { usePlayer } from '../../state/video';
  import { cn } from '../../utils';

  const player = usePlayer();
  let { class: className }: Props = $props();

  function currentTime(): string {
    let s = Math.abs(player.playhead);
    let m = Math.floor(s / 60);
    s -= m * 60;
    return `${player.playhead < 0 ? '-' : ''}${m}:${s.toFixed(3).padStart(6, '0')}`;
  }
</script>

<input
  readonly
  value={currentTime()}
  class={cn('w-32 text-2xl font-bold text-neutral-400 tabular-nums outline-none', className)}
/>
