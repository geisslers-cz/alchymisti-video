<script module lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from '../../utils';

  export type SortableItemProps = {
    id: string;
    class?: ClassValue;
    children?: Snippet;
  };
</script>

<script lang="ts">
  import { cn } from '../../utils';

  let { id, class: className, children }: SortableItemProps = $props();

  let itemProps = $derived({
    class: cn('[&.sortable-ghost]:opacity-0', className),
    'data-id': id,
  });
</script>

<li {...itemProps}>
  {@render children?.()}
</li>
