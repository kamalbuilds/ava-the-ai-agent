import { initializeAgent } from "..";
import { HumanMessage } from "@langchain/core/messages";

export const sendMessageToClient = async (prompt: string) => {
  if (!prompt) {
    throw new Error("Prompt is required");
  }

  try {
    const { agent, config } = await initializeAgent();
    const stream = await agent.stream(
      { messages: [new HumanMessage(prompt)] },
      config
    );

    let responseMessage = "";
    for await (const chunk of stream) {
      if ("agent" in chunk) {
        responseMessage = chunk.agent.messages[0].content;
      } else if ("tools" in chunk) {
        responseMessage = chunk.tools.messages[0].content;
      }
    }

    return responseMessage;
  } catch (error) {
    console.error("Error processing message:", error);
    throw error;
  }
};
