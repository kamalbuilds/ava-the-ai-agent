import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import { CdpTool, CdpToolkit } from "@coinbase/cdp-langchain";
import { Coinbase } from "@coinbase/coinbase-sdk";
import { ChatGroq } from "@langchain/groq";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import "dotenv/config";
import {
  SIGN_MESSAGE_PROMPT,
  signMessage,
  SignMessageInput,
} from "./actions/sign_message";
import {
  CREATE_PREDICTION_MESSAGE,
  createPrediction,
  CreatePredictionInput,
} from "./actions/create_prediction";

/**
 * Initialize the agent with CDP AgentKit
 *
 * @returns Agent executor and config
 */
export async function initializeAgent() {
  //   Initialize LLM
  const groqModel = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const apiKeyName = process.env.CDP_API_KEY_NAME as string;
  const apiKeyPrivateKey = process.env.CDP_API_KEY_PRIVATE_KEY as string;

  Coinbase.configure({
    apiKeyName,
    privateKey: apiKeyPrivateKey,
  });

  // Configure CDP AgentKit
  const walletDataConfig = {
    networkId: process.env.NETWORK_ID || "base-sepolia",
    mnemonicPhrase: process.env.MNEMONIC_PHRASE,
  };

  // Initialize CDP AgentKit
  const agentkit = await CdpAgentkit.configureWithWallet(walletDataConfig);

  // Initialize CDP AgentKit Toolkit and get tools
  const cdpToolkit = new CdpToolkit(agentkit);
  const tools = cdpToolkit.getTools();

  const signMessageTool = new CdpTool(
    {
      name: "Sign Message",
      description: SIGN_MESSAGE_PROMPT,
      argsSchema: SignMessageInput,
      func: signMessage,
    },
    agentkit
  );
  tools.push(signMessageTool);

  const PredictionTool = new CdpTool(
    {
      name: "Create Prediction",
      description: CREATE_PREDICTION_MESSAGE,
      argsSchema: CreatePredictionInput,
      func: createPrediction,
    },
    agentkit
  );
  tools.push(PredictionTool);

  // Store buffered conversation history in memory
  const memory = new MemorySaver();
  const agentConfig = {
    configurable: { thread_id: "CDP AgentKit Chatbot Example!" },
  };

  // Create React Agent using the LLM and CDP AgentKit tools
  const agent = createReactAgent({
    llm: groqModel,
    tools,
    checkpointSaver: memory,
    messageModifier: "You are AI Agent build by Coinbase Developer Agent Kit",
  });

  return { agent, config: agentConfig };
}
