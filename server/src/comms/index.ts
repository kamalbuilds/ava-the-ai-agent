export * from "./event-bus";

export interface EventBus {
  emit: (event: string, data: any) => Promise<void>;
  on: (event: string, handler: (data: any) => Promise<void>) => void;
}
