export function abortable(fn: (signal: AbortSignal) => Promise<(() => void) | void>): () => void {
  return () => {
    const ctrl = new AbortController();
    let cleanup: (() => void) | undefined;

    fn(ctrl.signal).then((c) => {
      if (c) {
        cleanup = c;
      }
    });

    return () => {
      ctrl.abort();
      cleanup?.();
    };
  };
}

export type AwaitedState<T> =
  | { resolved: false; result?: undefined; error?: undefined }
  | { resolved: true; result: T; error?: undefined }
  | { resolved: true; result?: undefined; error: Error };

class Awaited<T> {
  resolved: boolean;
  result?: T;
  error?: Error;
  private readonly promise: Promise<T>;

  constructor(src: () => Promise<T>) {
    this.promise = $derived(src());
    this.resolved = $derived(touch(false, this.promise));
    this.result = $derived(touch(undefined, this.promise));
    this.error = $derived(touch(undefined, this.promise));

    $effect.root(() => {
      $effect.pre(() => {
        const current = this.promise;

        current
          .then((res) => {
            if (this.promise === current) {
              this.resolved = true;
              this.result = res;
              this.error = undefined;
            }
          })
          .catch((e: any) => {
            if (this.promise === current) {
              this.resolved = true;
              this.result = undefined;
              this.error = e;
            }
          });
      });
    });
  }
}

export function awaited<T>(src: () => Promise<T>): AwaitedState<T> {
  return new Awaited(src) as AwaitedState<T>;
}

export function unwrapAwaited<T>(awaited: AwaitedState<T>): T;
export function unwrapAwaited<T, R>(awaited: AwaitedState<T>, unwrap: (value?: T) => R): R;
export function unwrapAwaited<T>(awaited: AwaitedState<T>, unwrap?: (value?: T) => any): any {
  const value = awaited.resolved && !awaited.error ? awaited.result : undefined;
  return unwrap ? unwrap(value) : value;
}

export function touch<R>(r: R, ...args: any[]): R;
export function touch<R>(r: R): R {
  return r;
}
