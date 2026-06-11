export type Listener<T = unknown> = (payload: T) => void;

/*
 * 轻量事件总线用于纯逻辑模块通信，返回取消订阅函数以降低生命周期清理成本。
 */
export class EventBus<Events extends Record<string, unknown>> {
  private readonly listeners = new Map<keyof Events, Set<Listener>>();

  on<K extends keyof Events>(eventName: K, listener: Listener<Events[K]>): () => void {
    const bucket = this.listeners.get(eventName) ?? new Set<Listener>();
    bucket.add(listener as Listener);
    this.listeners.set(eventName, bucket);
    return () => this.off(eventName, listener);
  }

  off<K extends keyof Events>(eventName: K, listener: Listener<Events[K]>): void {
    this.listeners.get(eventName)?.delete(listener as Listener);
  }

  emit<K extends keyof Events>(eventName: K, payload: Events[K]): void {
    this.listeners.get(eventName)?.forEach((listener) => listener(payload));
  }

  clear(): void {
    this.listeners.clear();
  }
}
