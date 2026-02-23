import Sortable from 'sortablejs';
import { type Attachment } from 'svelte/attachments';
import type { WritableBox } from 'svelte-toolbelt';

export type SortableItem = { id: string };

export type SortableOptions<T extends SortableItem> = {
  items: WritableBox<T[]>;
};

type OperationData<T extends SortableItem> = {
  item: T;
  restoreDOM(): void;
};

export function sortable<T extends SortableItem>({
  items,
}: SortableOptions<T>): Attachment<HTMLElement> {
  let currentOperation: OperationData<T> | undefined = undefined;

  return (container: HTMLElement) => {
    const zone = new Sortable(container, {
      animation: 150,
      easing: 'ease-in-out',
      handle: `[data-sortable-handle]`,
      direction: 'horizontal',
      swapThreshold: 0.4,
      onStart({ item: elem }): void {
        const item = items.current.find((item) => item.id === elem.dataset.id);
        const nextSibling = elem.nextSibling;

        currentOperation = {
          item,
          restoreDOM() {
            this.restoreDOM = () => {};
            zone.el.insertBefore(elem, nextSibling);
          },
        };

        zone.el.dataset.sortableActive = 'true';
      },
      onEnd(): void {
        currentOperation = undefined;
        delete zone.el.dataset.sortableActive;
      },
      onUpdate({ item: elem, oldIndex, newIndex }): void {
        if (elem.dataset.id !== currentOperation.item.id) {
          return;
        }

        currentOperation.restoreDOM();

        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
          return;
        }

        items.current = items.current
          .toSpliced(oldIndex, 1)
          .toSpliced(newIndex, 0, currentOperation.item);
      },
    });

    return () => {
      currentOperation?.restoreDOM();
      currentOperation = undefined;
      zone.destroy();
    };
  };
}
