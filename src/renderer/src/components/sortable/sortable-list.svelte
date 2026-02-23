<script module lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from '../../utils';
  import type { SortableItem } from './sortable.svelte';

  export type SortableListProps<T extends SortableItem> = {
    items: T[];
    class?: ClassValue;
    children?: Snippet;
  };
</script>

<script lang="ts" generics="T extends SortableItem">
  import { box } from 'svelte-toolbelt';
  import { sortable } from './sortable.svelte';

  let { items = $bindable([]), class: className, children }: SortableListProps<T> = $props();
</script>

<ul
  class={className}
  {@attach sortable({
    items: box.with(
      () => items,
      (i) => (items = i),
    ),
  })}
>
  {@render children?.()}
</ul>
