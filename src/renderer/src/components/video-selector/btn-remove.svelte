<script module lang="ts">
  import type { ClassValue } from '../../utils';

  type Props = {
    onclick?: (evt: MouseEvent) => void;
    class?: ClassValue;
  };
</script>

<script lang="ts">
  let { onclick, class: className }: Props = $props();
</script>
