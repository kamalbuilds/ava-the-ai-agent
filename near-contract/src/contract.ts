// Find all our documentation at https://docs.near.org
import { NearBindgen, near, call, view, initialize, NearPromise } from 'near-sdk-js';

@NearBindgen({})
class HelloNear {
  greeting: string = 'Hello';
  greeting_history: string[] = [];
  user_greetings: Record<string, string> = {};
  interaction_count: number = 0;
  last_interaction_timestamp: bigint = BigInt(0);
  contributors: string[] = [];

  @initialize({})
  init(): void {
    this.greeting = 'Hello NEAR World!';
    this.greeting_history = [this.greeting];
    this.interaction_count = 0;
  }

  @view({}) // This method is read-only and can be called for free
  get_greeting(): string {
    return this.greeting;
  }

  @call({}) // This method changes the state, for which it cost gas
  set_greeting({ greeting }: { greeting: string }): void {
    near.log(`Saving greeting ${greeting}`);
    this.greeting = greeting;
    this.greeting_history.push(greeting);
    this.interaction_count += 1;
    this.last_interaction_timestamp = near.blockTimestamp();
    
    const sender = near.predecessorAccountId();
    if (!this.contributors.includes(sender)) {
      this.contributors.push(sender);
    }
  }

  @view({})
  get_greeting_history(): string[] {
    return this.greeting_history;
  }

  @call({})
  set_user_greeting({ greeting }: { greeting: string }): void {
    const user_id = near.predecessorAccountId();
    near.log(`Setting greeting for user ${user_id}: ${greeting}`);
    this.user_greetings[user_id] = greeting;
    this.interaction_count += 1;
    this.last_interaction_timestamp = near.blockTimestamp();
  }

  @view({})
  get_user_greeting({ user_id }: { user_id: string }): string {
    return this.user_greetings[user_id] || "User hasn't set a greeting yet";
  }

  @view({})
  get_user_greeting_for_caller(): string {
    const user_id = near.predecessorAccountId();
    return this.user_greetings[user_id] || "You haven't set a greeting yet";
  }

  @view({})
  get_stats(): object {
    return {
      total_interactions: this.interaction_count,
      last_interaction: this.last_interaction_timestamp.toString(),
      unique_contributors: this.contributors.length,
      greeting_history_count: this.greeting_history.length
    };
  }

  @call({})
  increment_interactions(): void {
    this.interaction_count += 1;
    this.last_interaction_timestamp = near.blockTimestamp();
    const sender = near.predecessorAccountId();
    if (!this.contributors.includes(sender)) {
      this.contributors.push(sender);
    }
    near.log(`Interaction count incremented to ${this.interaction_count}`);
  }

  @call({})
  clear_greeting_history(): boolean {
    const sender = near.predecessorAccountId();
    // Only keep the current greeting
    const current = this.greeting;
    this.greeting_history = [current];
    this.interaction_count += 1;
    this.last_interaction_timestamp = near.blockTimestamp();
    near.log(`Greeting history cleared by ${sender}`);
    return true;
  }

  @call({})
  ping_contract({ message }: { message: string }): string {
    const sender = near.predecessorAccountId();
    near.log(`Received ping from ${sender}: ${message}`);
    this.interaction_count += 1;
    this.last_interaction_timestamp = near.blockTimestamp();
    return `Pong! Received: "${message}"`;
  }
}