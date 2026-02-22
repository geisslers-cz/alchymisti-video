declare const self: DedicatedWorkerGlobalScope;

export interface WorkerApi {
  [method: string]: (...args: any[]) => any;
}

export class TypedWorker<Api extends WorkerApi> extends Worker {
  private readonly calls: Map<string, PromiseWithResolvers<any>> = new Map();

  constructor(url: URL | string) {
    super(url, { type: 'module' });
    this.addEventListener('message', this.handleMessage);
  }

  async call<Method extends keyof Api>(
    method: Method,
    ...args: Parameters<Api[Method]>
  ): Promise<ReturnType<Api[Method]>> {
    const callId = crypto.randomUUID();
    const api: PromiseWithResolvers<any> = Promise.withResolvers();
    this.calls.set(callId, api);
    this.postMessage({ callId, method, args });
    return api.promise;
  }

  private readonly handleMessage = (evt: MessageEvent): void => {
    const api = this.calls.get(evt.data.callId);

    if (!api) {
      return;
    }

    if (evt.data.error) {
      const error = new Error(evt.data.error.message);
      error.name = evt.data.error.name;
      error.stack = evt.data.error.stack;
      api.reject(error);
    } else {
      api.resolve(evt.data.result);
    }
  };
}

export function registerWorkerMethods<Api extends WorkerApi>(api: Api): void {
  self.addEventListener('message', async (evt) => {
    const { callId, method, args } = evt.data;

    if (!(method in api)) {
      self.postMessage({
        callId,
        error: mkerr(new Error(`Unknown worker method: '${method}'`), 'InternalError'),
      });
      return;
    }

    try {
      const result = await api[method](...args);
      self.postMessage({ callId, result });
    } catch (e: unknown) {
      self.postMessage({ callId, error: mkerr(e) });
    }
  });
}

function mkerr(err: any, name?: string) {
  const stack = err.stack.split(/\n/g).slice(2).join('\n');
  return { name: name ?? err.name, message: err.message, stack };
}
