import { PlaybackState, Player } from '../../state/video';
import { touch } from '../../utils';

const baseViewDuration = 15;
const maxZoom = 200;

export class ViewContext {
  width: number = $state(0);
  zoom: number = $state(1);
  start: number;
  readonly duration: number;
  readonly pxPerSec: number;
  followPlayback: boolean = $state(true);
  suppressFollow: boolean = $state(false);
  private currentStart: number;
  private readonly lastPlaybackStart: number;
  private readonly minZoom: number;

  constructor(private readonly player: Player) {
    this.duration = $derived(baseViewDuration / this.zoom);
    this.pxPerSec = $derived(this.width / this.duration);
    this.currentStart = -this.duration / 4;
    this.lastPlaybackStart = $derived(
      touch(this.currentStart + 0.1 * this.duration, this.player.playbackState),
    );

    this.start = $derived.by(() => {
      if (
        !this.followPlayback ||
        this.player.playbackState !== PlaybackState.Playing ||
        this.suppressFollow
      ) {
        return this.currentStart;
      }

      const start: number =
        this.lastPlaybackStart +
        0.8 *
          this.duration *
          Math.floor((this.player.playhead - this.lastPlaybackStart) / (0.8 * this.duration)) -
        0.1 * this.duration;

      return (this.currentStart = Math.min(
        Math.max(this.player.timelineStart, start),
        this.player.timelineEnd - this.duration,
      ));
    });

    this.minZoom = $derived(
      baseViewDuration / (this.player.timelineEnd - this.player.timelineStart),
    );
  }

  handleWheel(evt: WheelEvent, center: number): void {
    const horizontal = Math.abs(evt.deltaX) > Math.abs(evt.deltaY);
    const scroll = horizontal ? evt.deltaX / this.pxPerSec : 0;
    const factor = !horizontal ? (evt.deltaY < 0 ? 1 / 1.02 : 1.02) : 0;
    const zoom = this.zoom;
    const duration = this.duration;
    const start = this.currentStart;
    const newZoom = factor > 0 ? Math.max(this.minZoom, Math.min(maxZoom, zoom * factor)) : zoom;
    this.suppressFollow = true;
    this.zoom = newZoom;
    this.currentStart = this.start = Math.max(
      this.player.timelineStart,
      Math.min(
        this.player.timelineEnd - duration,
        start + scroll + center * (duration - baseViewDuration / newZoom),
      ),
    );
  }
}
