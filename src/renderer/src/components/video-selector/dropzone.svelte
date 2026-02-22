<script lang="ts">
  import { usePlayer } from '../../state/video';

  const player = usePlayer();
  let showOverlay: boolean = $state(false);
  let errorMsg: string | undefined = $state();

  function ondragover(evt: DragEvent): void {
    if (player.files.size > 4) {
      return;
    }

    evt.preventDefault();

    if (showOverlay) {
      return;
    }

    showOverlay = true;

    for (const item of evt.dataTransfer.items) {
      if (item.kind !== 'file' || !/^video\/.+/.test(item.type)) {
        errorMsg = 'Unsupported file type(s)';
        return;
      }
    }

    errorMsg = undefined;
  }

  function ondragleave(evt: DragEvent): void {
    evt.preventDefault();

    if (evt.relatedTarget !== null) {
      return;
    }

    showOverlay = false;
    errorMsg = undefined;
  }

  function ondrop(evt: DragEvent): void {
    evt.preventDefault();
    showOverlay = false;
    errorMsg = undefined;

    for (const file of evt.dataTransfer.files) {
      if (player.files.size > 4) {
        break;
      }

      if (/^video\/.+/.test(file.type)) {
        player.add(file);
      }
    }
  }
</script>

<svelte:body {ondragover} {ondragleave} />

<div
  role="application"
  {ondrop}
  class={[
    'fixed top-0 left-0 z-50 flex h-screen w-screen items-center justify-center bg-black/40',
    !showOverlay && 'hidden',
  ]}
>
  <div class={[errorMsg?.length && 'text-red-500', 'text-2xl']}>
    {errorMsg ?? "Drop 'em!"}
  </div>
</div>
