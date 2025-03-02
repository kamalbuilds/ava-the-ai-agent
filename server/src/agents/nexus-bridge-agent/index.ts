import { Agent } from '../agent';
import type { EventBus } from "../../comms";
import { AIProvider } from "../../services/ai/types";
import { StorageInterface } from "../types/storage";
import { ATCPIPProvider } from "../plugins/atcp-ip";
import { ethers } from "ethers";
import { NexusClient, MailBoxClient, ProofManagerClient, ZKSyncVerifier } from "nexus-js";
import { bridgeTokens } from './constants';
import { sendTokenAction } from './actions/sendToken';
import { receiveTokenAction } from './actions/receiveToken';
import { verifyBridgeAction } from './actions/verifyBridge';

export class NexusBridgeAgent extends Agent {
  private storage: StorageInterface;
  private atcpipProvider: ATCPIPProvider;
  private privateKey: string;
  private sourceChainProvider: ethers.providers.JsonRpcProvider;
  private destChainProvider: ethers.providers.JsonRpcProvider;
  private sourceBridgeContract: ethers.Contract;
  private destBridgeContract: ethers.Contract;
  private sourceMailboxAddress: string;
  private destMailboxAddress: string;
  private sourceProofManagerAddress: string;
  private destProofManagerAddress: string;
  private sourceAppId: string;
  private destAppId: string;
  private nexusRpcUrl: string;
  private taskResults: Map<string, any>;
  private currentTaskId: string | null = null;

  constructor(
    name: string,
    eventBus: EventBus,
    storage: StorageInterface,
    atcpipProvider: ATCPIPProvider,
    config: {
      privateKey: string;
      sourceChainRpcUrl: string;
      destChainRpcUrl: string;
      sourceBridgeAddress: string;
      destBridgeAddress: string;
      sourceMailboxAddress: string;
      destMailboxAddress: string;
      sourceProofManagerAddress: string;
      destProofManagerAddress: string;
      sourceAppId: string;
      destAppId: string;
      nexusRpcUrl: string;
    },
    aiProvider?: AIProvider
  ) {
    super(name, eventBus, aiProvider);
    this.storage = storage;
    this.atcpipProvider = atcpipProvider;
    this.privateKey = config.privateKey;
    this.sourceChainProvider = new ethers.providers.JsonRpcProvider(config.sourceChainRpcUrl);
    this.destChainProvider = new ethers.providers.JsonRpcProvider(config.destChainRpcUrl);
    this.sourceMailboxAddress = config.sourceMailboxAddress;
    this.destMailboxAddress = config.destMailboxAddress;
    this.sourceProofManagerAddress = config.sourceProofManagerAddress;
    this.destProofManagerAddress = config.destProofManagerAddress;
    this.sourceAppId = config.sourceAppId;
    this.destAppId = config.destAppId;
    this.nexusRpcUrl = config.nexusRpcUrl;
    this.taskResults = new Map();

    // Initialize contracts
    const sourceSigner = new ethers.Wallet(this.privateKey, this.sourceChainProvider);
    const destSigner = new ethers.Wallet(this.privateKey, this.destChainProvider);
    
    // We'll need to import the ABIs for these contracts
    this.sourceBridgeContract = new ethers.Contract(
      config.sourceBridgeAddress,
      [], // Bridge ABI will be imported from a file
      sourceSigner
    );
    
    this.destBridgeContract = new ethers.Contract(
      config.destBridgeAddress,
      [], // Bridge ABI will be imported from a file
      destSigner
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Listen for task-manager-nexus-bridge events
    this.eventBus.register(`task-manager-${this.name}`, (data) => {
      this.handleEvent(`task-manager-${this.name}`, data);
    });
  }

  async handleEvent(event: string, data: any): Promise<void> {
    console.log(`[${this.name}] Received event: ${event}`);
    
    if (event === `task-manager-${this.name}`) {
      await this.handleTaskManagerRequest(data);
    }
  }

  private async handleTaskManagerRequest(data: any): Promise<void> {
    const { taskId, task } = data;
    this.currentTaskId = taskId;

    try {
      console.log(`[${this.name}] Processing task: ${task}`);
      
      // Parse the task with AI to determine what operation to perform
      const { operation, params } = await this.parseTaskWithAI(task);
      
      // Execute the operation
      const result = await this.executeOperation(operation, params);
      
      // Store the result
      this.taskResults.set(taskId, result);
      
      // Notify task manager of completion
      this.eventBus.emit(`${this.name}-task-manager`, {
        taskId,
        status: 'completed',
        result
      });
      
    } catch (error: any) {
      console.error(`[${this.name}] Error processing task: ${error.message}`);
      
      // Notify task manager of failure
      this.eventBus.emit(`${this.name}-task-manager`, {
        taskId,
        status: 'failed',
        error: error.message
      });
    }
    
    this.currentTaskId = null;
  }

  private async parseTaskWithAI(task: string): Promise<{ operation: string, params: any }> {
    if (!this.aiProvider) {
      throw new Error("AI provider not available");
    }

    const systemPrompt = `
      You are an AI assistant helping with Nexus Bridge operations. 
      Parse the user's request and extract the operation to perform and its parameters.
      
      Available operations:
      1. sendToken - Send tokens from source chain to destination chain
      2. receiveToken - Receive tokens on destination chain that were sent from source chain
      3. verifyBridge - Verify the status of a bridge transaction
      
      Return a JSON object with the following structure:
      {
        "operation": "one of the available operations",
        "params": {
          // parameters specific to the operation
        }
      }
    `;

    const response = await this.aiProvider.generateText(task, systemPrompt);

    try {
      // Extract JSON from the response
      const responseText = typeof response === 'string' ? response : response.text;
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                        responseText.match(/```\n([\s\S]*?)\n```/) ||
                        responseText.match(/({[\s\S]*?})/);
      
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      }
      
      // If no JSON format is found, try to parse the entire response
      return typeof response === 'string' ? JSON.parse(response) : JSON.parse(response.text);
    } catch (error) {
      console.error(`[${this.name}] Error parsing AI response: ${error}`);
      throw new Error(`Failed to parse task: ${error}`);
    }
  }

  private async executeOperation(operation: string, params: any): Promise<any> {
    switch (operation) {
      case 'sendToken':
        return await sendTokenAction(this, params);
      case 'receiveToken':
        return await receiveTokenAction(this, params);
      case 'verifyBridge':
        return await verifyBridgeAction(this, params);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  async onStepFinish({ text, toolCalls, toolResults }: any): Promise<void> {
    if (!this.currentTaskId) return;
    
    // Emit progress updates to the frontend
    this.eventBus.emit(`${this.name}-frontend`, {
      type: 'step',
      taskId: this.currentTaskId,
      text,
      toolCalls,
      toolResults
    });
  }

  // Helper methods that can be used by actions
  async getSourceChainSigner(): Promise<ethers.Wallet> {
    return new ethers.Wallet(this.privateKey, this.sourceChainProvider);
  }

  async getDestChainSigner(): Promise<ethers.Wallet> {
    return new ethers.Wallet(this.privateKey, this.destChainProvider);
  }

  async getSourceBridgeContract(): Promise<ethers.Contract> {
    return this.sourceBridgeContract;
  }

  async getDestBridgeContract(): Promise<ethers.Contract> {
    return this.destBridgeContract;
  }

  async getNexusClient(appId: string): Promise<NexusClient> {
    return new NexusClient(this.nexusRpcUrl, appId);
  }

  async getZKSyncVerifier(): Promise<ZKSyncVerifier> {
    return new ZKSyncVerifier({
      [this.sourceAppId]: {
        rpcUrl: await this.sourceChainProvider.getNetwork().then(n => n.name),
        mailboxContract: this.sourceMailboxAddress,
        stateManagerContract: this.sourceProofManagerAddress,
        appID: this.sourceAppId,
        chainId: await this.sourceChainProvider.getNetwork().then(n => n.chainId.toString()),
        type: "ZKSync", // This should be replaced with the actual network type
        privateKey: this.privateKey
      },
      [this.destAppId]: {
        rpcUrl: await this.destChainProvider.getNetwork().then(n => n.name),
        mailboxContract: this.destMailboxAddress,
        stateManagerContract: this.destProofManagerAddress,
        appID: this.destAppId,
        chainId: await this.destChainProvider.getNetwork().then(n => n.chainId.toString()),
        type: "ZKSync", // This should be replaced with the actual network type
        privateKey: this.privateKey
      }
    }, this.sourceAppId);
  }

  async getMailboxClient(isSource: boolean): Promise<MailBoxClient> {
    const provider = isSource ? this.sourceChainProvider : this.destChainProvider;
    const mailboxAddress = isSource ? this.sourceMailboxAddress : this.destMailboxAddress;
    return new MailBoxClient(mailboxAddress, await provider.getNetwork().then(n => n.name), this.privateKey);
  }

  async getProofManagerClient(isSource: boolean): Promise<ProofManagerClient> {
    const provider = isSource ? this.sourceChainProvider : this.destChainProvider;
    const proofManagerAddress = isSource ? this.sourceProofManagerAddress : this.destProofManagerAddress;
    return new ProofManagerClient(proofManagerAddress, await provider.getNetwork().then(n => n.name), this.privateKey);
  }
} 