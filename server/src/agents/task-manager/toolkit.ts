import { z } from "zod";
import type { Tool, ToolResult, ToolExecutionOptions } from "../../services/ai/types";
import type { EventBus } from "../../comms";

export const getTaskManagerToolkit = () => {
  const tools: Record<string, Tool> = {
    sendMessageToObserver: {
      parameters: z.object({
        message: z.string()
      }),
      description: "Send a message to the observer agent",
      execute: async (args: Record<string, any>, options?: ToolExecutionOptions): Promise<ToolResult> => {
        try {
          return {
            success: true,
            result: `Message sent to observer: ${args.message}`
          };
        } catch (error) {
          return {
            success: false,
            result: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    },
    sendMessageToExecutor: {
      parameters: z.object({
        message: z.string()
      }),
      description: "Send a message to the executor agent",
      execute: async (args: Record<string, any>, options?: ToolExecutionOptions): Promise<ToolResult> => {
        try {
          return {
            success: true,
            result: `Message sent to executor: ${args.message}`
          };
        } catch (error) {
          return {
            success: false,
            result: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    }
  };

  return tools;
};
