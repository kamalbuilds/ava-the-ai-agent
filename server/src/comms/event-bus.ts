import { EventEmitter } from "events";

/**
 * EventBus is a simple event bus implementation using the EventEmitter from Node.js.
 * It allows you to register callbacks for specific events and emit events with data.
 * In this context, it's used to communicate between agents.
 *  */

export class EventBus {
  private eventEmitter: EventEmitter;
  private subscribers: Map<string, Function[]>;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.subscribers = new Map();
  }

  /**
   * Register a callback for an event.
   * @param event - The event name.
   * @param callback - The callback function.
   */
  register(event: string, callback: (data: any) => void) {
    this.eventEmitter.on(event, callback);
  }

  /**
  * Unregister a callback for an event.
  * @param event - The event name.
  * @param callback - The callback function.
  */
  unregister(event: string, callback: (data: any) => void) {
    if (this.eventEmitter.eventNames().includes(event)) {
      this.eventEmitter.off(event, callback);
    }
  }
  /**
   * Emit an event with data.
   * @param event - The event name.
   * @param data - The data to emit.
   */
  emit(event: string, data: any) {
    this.eventEmitter.emit(event, data);
    // Also notify subscribers
    if (this.subscribers.has(event)) {
      this.subscribers.get(event)?.forEach(callback => callback(data));
    }
  }

  subscribe(event: string, callback: Function) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event)?.push(callback);
  }

  unsubscribe(event: string, callback: Function) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
}
