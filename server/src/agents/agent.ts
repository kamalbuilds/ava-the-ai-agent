import type { EventBus } from "../comms";
import type { AIProvider } from "../services/ai/types";

export abstract class Agent {
  name: string;
  protected eventBus: EventBus;
  protected aiProvider?: AIProvider;

  constructor(name: string, eventBus: EventBus, aiProvider?: AIProvider) {
    this.name = name;
    this.eventBus = eventBus;
    this.aiProvider = aiProvider;
  }

  abstract handleEvent(event: string, data: any): void;

  abstract onStepFinish({ text, toolCalls, toolResults }: any): Promise<void>;
}
