import { Agent } from "./app/types/event-bus";

export const initializeAgents = async (): Promise<Agent[]> => {
  // Initialize your agents here
  const agents: Agent[] = [
    {
      id: "1",
      name: "AVA",
      type: "assistant",
      status: "active",
      description: "Your AI-powered assistant",
    }
  ];
  
  return agents;
};
