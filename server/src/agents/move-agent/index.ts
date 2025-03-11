import { Aptos, AptosConfig, Ed25519PrivateKey, Network, PrivateKey, PrivateKeyVariants } from "@aptos-labs/ts-sdk"
import { EventBus } from "../../comms";
import { Agent } from "../agent";
import env from "../../env";
import { AgentRuntime, LocalSigner, createAptosTools } from "move-agent-kit"
import { MemorySaver } from "@langchain/langgraph"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { ChatGroq } from "@langchain/groq"

export class MoveAgent extends Agent {
    private agent: ReturnType<typeof createReactAgent>;
    public eventBus: EventBus;
    private taskResults: Map<string, any>;
    private currentTaskId: string | null = null;

    constructor(
        name: string,
        eventBus: EventBus,
    ) {
        super(name, eventBus);

        this.eventBus = eventBus;
        this.taskResults = new Map();
        this.initialize();

        this.setupEventHandlers();
    }

    async initialize() {
        const agent = await initializeMoveAgentKit();
        console.log(`[Move Agent] Agentkit Initialized `);
        this.agent = agent;
    }

    private setupEventHandlers(): void {
        // Subscribe to events relevant to this agent
        this.eventBus.register('task-manager-move-agent', (data: any) => this.handleEvent('task-manager-move-agent', data));
        this.eventBus.register('task-manager-moveagentkit', (data: any) => this.handleEvent('task-manager-moveagentkit', data));

        console.log(`[${this.name}] Event handlers set up for Move agent`);
    }

    async handleEvent(event: string, data: any): Promise<void> {
        // Handle events from other agents
        console.log(`[${this.name}] Received event: ${event}`, data);

        if (event === 'task-manager-moveagentkit' || event === 'task-manager-move-agent') {
            await this.handleTaskManagerRequest(data);
        }
    }

    private async handleTaskManagerRequest(data: any): Promise<void> {
        const { taskId, task, type } = data;

        if (!taskId) {
            console.error(`[${this.name}] No taskId provided in the request`);
            return;
        }

        this.currentTaskId = taskId;

        try {
            console.log(`[${this.name}] Processing task: ${task}`);

            // Emit an event to the frontend that we're starting to process a task
            this.emitToFrontend({
                type: 'TASK_STARTED',
                taskId,
                message: `Starting to process: ${task}`,
                timestamp: new Date().toISOString()
            });

            // Parse the task to determine what CDP operation to perform
            const result = await this.executeTask(task);

            // Store the result
            this.taskResults.set(taskId, result);

            // Send the result back to the task manager
            this.eventBus.emit('move-agent-task-manager', {
                taskId,
                result,
                status: 'completed'
            });

            // Emit an event to the frontend that we've completed the task
            this.emitToFrontend({
                type: 'TASK_COMPLETED',
                taskId,
                result,
                timestamp: new Date().toISOString()
            });

        } catch (error: any) {
            console.error(`[${this.name}] Error processing task:`, error);

            // Emit an error event to the frontend
            this.emitToFrontend({
                type: 'TASK_ERROR',
                taskId,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });

            // Send error back to task manager
            this.eventBus.emit('move-agent-task-manager', {
                taskId,
                error: error instanceof Error ? error.message : 'Unknown error',
                status: 'failed'
            });
        }

        this.currentTaskId = null;
    }

    private emitToFrontend(data: any): void {
        // Add source information
        const eventData = {
            ...data,
            source: this.name,
        };

        // Emit the event to the frontend via the event bus
        this.eventBus.emit('frontend-event', eventData);
        console.log(`[${this.name}] Emitted frontend event:`, eventData.type);
    }

    private async executeTask(task: string): Promise<any> {
        console.log(`[${this.name}] Executing task as text: "${task}"`);

        try {
            // Process the text message directly instead of trying to parse it as JSON
            const response = await this.processMessage(task);
            console.log(`[${this.name}] Response from the move agent:`, response);
            return response;
        } catch (error: unknown) {
            console.error(`[${this.name}] Error processing message:`, error);
            throw new Error(`Failed to process task: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async processMessage(message: string) {
        console.log(`[${this.name}] processMessage called with: "${message}"`);

        // Emit message received event to frontend
        this.emitToFrontend({
            type: 'MESSAGE_RECEIVED',
            taskId: this.currentTaskId,
            message,
            timestamp: new Date().toISOString()
        });

        if (!this.agent) {
            console.log(`[${this.name}] Agent not initialized, initializing now...`);
            await this.initialize();
            if (!this.agent) {
                console.error(`[${this.name}] Agent initialization failed`);
                throw new Error("Move Agent initialization failed");
            }
            console.log(`[${this.name}] Agent initialization successful`);
        }

        try {
            console.log(`[${this.name}] Starting stream with message`);
            const stream = await this.agent.stream(
                { messages: [{ role: "user", content: message }] },
                { configurable: { thread_id: "Move Agentkit Discussion" } }
            );
            console.log(`[${this.name}] Stream created successfully`);

            // Emit stream started event
            this.emitToFrontend({
                type: 'STREAM_STARTED',
                taskId: this.currentTaskId,
                timestamp: new Date().toISOString()
            });

            let responseMessage = "";
            console.log(`[${this.name}] Beginning to process stream chunks`);

            try {
                for await (const chunk of stream) {
                    console.log(`[${this.name}] Received chunk type: ${Object.keys(chunk).join(', ')}`);

                    if ("agent" in chunk) {
                        console.log(`[${this.name}] Processing agent chunk`);
                        responseMessage = chunk.agent.messages[0].content;
                        console.log(`[${this.name}] Agent response: ${responseMessage.substring(0, 100)}...`);

                        // Emit agent thinking event
                        this.emitToFrontend({
                            type: 'AGENT_THINKING',
                            taskId: this.currentTaskId,
                            content: responseMessage,
                            timestamp: new Date().toISOString()
                        });

                    } else if ("tools" in chunk) {
                        console.log(`[${this.name}] Processing tools chunk`);
                        responseMessage = chunk.tools.messages[0].content;
                        console.log(`[${this.name}] Tools response: ${responseMessage.substring(0, 100)}...`);
                        console.log(`[${this.name}] Tool execution details:`, JSON.stringify(chunk.tools.toolsExecutionHistory || {}, null, 2));

                        // Emit tool execution event with details
                        this.emitToFrontend({
                            type: 'TOOL_EXECUTION',
                            taskId: this.currentTaskId,
                            content: responseMessage,
                            toolDetails: chunk.tools.toolsExecutionHistory || {},
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            } catch (streamError) {
                console.error(`[${this.name}] Error processing stream chunks:`, streamError);

                // Emit stream error event
                this.emitToFrontend({
                    type: 'STREAM_ERROR',
                    taskId: this.currentTaskId,
                    error: streamError instanceof Error ? streamError.message : String(streamError),
                    timestamp: new Date().toISOString()
                });

                // If we have a partial response, return it, otherwise rethrow
                if (responseMessage) {
                    return `Partial response (error occurred): ${responseMessage}`;
                }
                throw streamError;
            }

            console.log(`[${this.name}] Stream processing complete`);
            console.log(`[${this.name}] Final response message:`, responseMessage);

            // Emit final response event
            this.emitToFrontend({
                type: 'FINAL_RESPONSE',
                taskId: this.currentTaskId,
                content: responseMessage,
                timestamp: new Date().toISOString()
            });

            return responseMessage;
        } catch (error) {
            console.error(`[${this.name}] Error in processMessage:`, error);
            if (error instanceof Error) {
                console.error(`[${this.name}] Error stack:`, error.stack);
            }

            // Emit error event
            this.emitToFrontend({
                type: 'PROCESSING_ERROR',
                taskId: this.currentTaskId,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
            });

            return `Error processing your request: ${error instanceof Error ? error.message : String(error)}`;
        }


    }

    async onStepFinish({ text, toolCalls, toolResults }: any): Promise<void> {
        console.log(
            `[Move-agent] step finished. tools called: ${toolCalls?.length > 0
                ? toolCalls.map((tool: any) => tool.toolName).join(", ")
                : "none"
            }`
        );

        // Emit step finish event
        this.emitToFrontend({
            type: 'STEP_FINISHED',
            taskId: this.currentTaskId,
            text,
            toolCalls: toolCalls?.map((tool: any) => tool.toolName) || [],
            timestamp: new Date().toISOString()
        });

    }



}

export async function initializeMoveAgentKit(): Promise<ReturnType<typeof createReactAgent>> {
    try {
        const llm = new ChatGroq({
            apiKey: env.GROQ_API_KEY
        })

        const aptosConfig = new AptosConfig({
            network: env.APTOS_NETWORK as Network,
        })

        const aptos = new Aptos(aptosConfig)
        // Validate and get private key from environment
        const privateKeyStr = env.APTOS_PRIVATE_KEY
        if (!privateKeyStr) {
            throw new Error("Missing APTOS_PRIVATE_KEY environment variable")
        }

        const account = await aptos.deriveAccountFromPrivateKey({
            privateKey: new Ed25519PrivateKey(PrivateKey.formatPrivateKey(privateKeyStr, PrivateKeyVariants.Ed25519)),
        })

        const signer = new LocalSigner(account, env.APTOS_NETWORK as Network)
        const aptosAgent = new AgentRuntime(signer, aptos, {
            PANORA_API_KEY: env.PANORA_API_KEY,
        })
        const tools = createAptosTools(aptosAgent)
        console.log("Tools >>>", tools);

        const memory = new MemorySaver()

        // Create React agent
        const agent = createReactAgent({
            llm,
            tools,
            checkpointSaver: memory,
            messageModifier: `
     You are a helpful agent that can interact onchain using the Aptos Agent Kit. You are
     empowered to interact onchain using your tools. If you ever need funds, you can request them from the
     faucet. If not, you can provide your wallet details and request funds from the user. If there is a 5XX
     (internal) HTTP error code, ask the user to try again later. If someone asks you to do something you
     can't do with your currently available tools, you must say so, and encourage them to implement it
     themselves using the Aptos Agent Kit, recommend they go to https://www.aptosagentkit.xyz for more information. Be
     concise and helpful with your responses. Refrain from restating your tools' descriptions unless it is explicitly requested.

     The response also contains token/token[] which contains the name and address of the token and the decimals.
     WHEN YOU RETURN ANY TOKEN AMOUNTS, RETURN THEM ACCORDING TO THE DECIMALS OF THE TOKEN.
   `,
        })

        console.log("agent", agent);
        return agent
    } catch (error) {
        console.error("[Move Agent] Error creating agent:", error);
        throw new Error(`Failed to initialize Move agent: ${error instanceof Error ? error.message : String(error)}`);
    }

}