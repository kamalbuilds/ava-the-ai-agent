import { initializeAgent } from "../agent";
import { HumanMessage } from "@langchain/core/messages";
import express from "express";

export const sendMessageToClient = async (
  req: express.Request,
  res: express.Response
) => {
  const { prompt }: { prompt: string } = req.body; // Get the prompt from the request body
  if (!prompt) {
    return res.status(400).send("Prompt is required");
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

    res.json({ response: responseMessage });
  } catch (error) {
    console.error("Error processing message:", error);
    res.status(500).send("Internal Server Error");
  }
};
