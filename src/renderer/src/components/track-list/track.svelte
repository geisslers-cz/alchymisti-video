<script module lang="ts">
  import { VideoFile } from '../../state/video';

  type Props = {
    file: VideoFile;
  };
</script>

<script lang="ts">
  let { file }: Props = $props();
</script>

<div class="flex flex-col bg-neutral-500 p-2">
  <div class="relative grow">
    <div class="absolute top-0 left-0 size-full">
      <img
        src={file.thumb}
        alt={file.name}
        class={[
          'absolute top-1/2 left-1/2 aspect-square max-h-full max-w-full -translate-1/2',
          'rotate-[calc(var(--rotate)*1deg)] overflow-hidden rounded-full object-cover',
        ]}
        style:--rotate={file.rotate}
      />
    </div>
  </div>
</div>
