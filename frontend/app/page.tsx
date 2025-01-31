"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { initializeAgents } from "./agents";
import { SendHorizontal, Bot, User } from "lucide-react";
import { AgentCharacters } from "./agents/AgentCharacters";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { EXAMPLE_RESPONSES } from "../lib/example";
import { EventBus } from "./types/event-bus"; // Revert to type import since implementation is server-side
import { WebSocketEventBus } from "./services/websocket-event-bus";

type CollaborationType =
  | "analysis"
  | "execution"
  | "report"
  | "question"
  | "response"
  | "suggestion"
  | "decision";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  agentId?: string;
  agentName?: string;
  collaborationType?: CollaborationType;
}

interface AgentState {
  isInitialized: boolean;
  isProcessing: boolean;
  error: string | null;
  activeAgent: string | null;
  systemEvents: Array<{
    timestamp: string;
    event: string;
    agent?: string;
    type: "info" | "warning" | "error" | "success";
  }>;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
  message?: string;
  agent?: any;
}

// Add a mapping for agent images
const agentImages = {
  trading: "/agent_trader.png",
  liquidity: "/agent_liquidity.png",
  portfolio: "/agent_default.png",
  "defi-analytics": "/agent_analyst.png",
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>({
    isInitialized: false,
    isProcessing: false,
    error: null,
    activeAgent: null,
    systemEvents: [],
  });
  const [agents, setAgents] = useState<Agent[]>([]);

  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const agentRef = useRef<any>(null);
  const eventBusRef = useRef<EventBus | null>(null);
  const agentsRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const setupAgents = async () => {
      try {
        setAgentState((prev) => ({
          ...prev,
          isProcessing: true,
          systemEvents: [
            ...prev.systemEvents,
            {
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              event: "Initializing AI agents...",
              type: "info",
            },
          ],
        }));

        const initializedAgents = await initializeAgents();
        setAgents(initializedAgents);

        setAgentState((prev) => ({
          ...prev,
          isInitialized: true,
          systemEvents: [
            ...prev.systemEvents,
            {
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              event: "AI agents initialized successfully",
              type: "success",
            },
          ],
        }));

        setMessages([
          {
            role: "assistant",
            content:
              "Hello! I'm Ava, your AI portfolio manager. I can help you manage your DeFi portfolio on Avalanche. What would you like to do?",
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      } catch (error) {
        setAgentState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Failed to initialize agents",
          systemEvents: [
            ...prev.systemEvents,
            {
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              event: `Initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
              type: "error",
            },
          ],
        }));
      } finally {
        setAgentState((prev) => ({ ...prev, isProcessing: false }));
      }
    };

    setupAgents();
  }, []);

  useEffect(() => {
    if (autonomousMode && !eventBusRef.current) {
      // Initialize WebSocket connection
      const eventBus = new WebSocketEventBus();
      eventBusRef.current = eventBus;

      console.log("Event Bus Ref", eventBus, eventBusRef.current);

      // Connect to backend WebSocket
      eventBus.connect("ws://localhost:3002");

      subscribeToAgentEvents();

      addSystemEvent({
        event: "Autonomous agents activated",
        type: "success",
      });
    } else if (!autonomousMode && eventBusRef.current) {
      // Send stop command and cleanup
      eventBusRef.current.emit("command", {
        type: "command",
        command: "stop",
      });
      cleanupAutonomousAgents();
    }
  }, [autonomousMode]);

  const [socket, setSocket] = useState(null);

  const handleSendMessage = () => {
    console.log(
      "sending message to the server to start the event",
      eventBusRef.current
    );

    if (eventBusRef.current) {
      eventBusRef.current.ws?.send(
        JSON.stringify({ type: "command", command: "stop" })
      );
    }
    // if (socket) {
    //   socket.send(JSON.stringify({ data: "Please start the agent" })); // Send message to server
    // }
  };

  useEffect(() => {
    console.log("socket connection start>>>");

    const eventBus = new WebSocketEventBus();
    eventBusRef.current = eventBus;

    eventBus.connect("ws://localhost:3002");

    console.log("Event Bus", eventBus);

    if (eventBus.ws) {
      eventBus.ws.onmessage = (ev) => {
        console.log("Ev", ev);
        const event = JSON.parse(ev.data);
        console.log("Event", event);

        addSystemEvent({
          event: event.type,
          agent: event.agent,
          type: event.action,
        });

        subscribeToAgentEvents();
      };
    }

    subscribeToAgentEvents();
  }, []);

  const cleanupAutonomousAgents = () => {
    eventBusRef.current = null;
    agentsRef.current = null;
    addSystemEvent({
      event: "Autonomous agents deactivated",
      type: "info",
    });
  };

  const subscribeToAgentEvents = () => {
    if (!eventBusRef.current) return;

    // Handle system events
    eventBusRef.current.subscribe('agent-event', (data: any) => {
      const timestamp = new Date().toLocaleTimeString();

      // Avoid duplicate events
      const lastEvent = agentState.systemEvents[agentState.systemEvents.length - 1];
      if (lastEvent?.event === data.action && lastEvent?.agent === data.agent) {
        return;
      }

      setAgentState(prev => ({
        ...prev,
        systemEvents: [...prev.systemEvents, {
          event: data.action || data.error || 'Unknown event',
          agent: data.agent,
          type: data.error ? 'error' : 'info',
          timestamp
        }]
      }));
    });

    // Handle agent messages in chat
    eventBusRef.current.subscribe('agent-message', (data: any) => {
      const timestamp = new Date().toLocaleTimeString();

      // Avoid duplicate messages
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.content === data.message && lastMessage?.agentName === data.agent) {
        return;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        timestamp,
        agentName: data.agent,
        collaborationType: data.collaborationType
      }]);
    });
  };

  const handleMessage = async (message: string) => {
    if (!message.trim()) return;

    const timestamp = new Date().toLocaleTimeString();

    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: message,
      timestamp
    }]);

    if (autonomousMode && eventBusRef.current) {
      // Send task to autonomous agents
      eventBusRef.current.emit('command', {
        type: 'command',
        command: message
      });

      addSystemEvent({
        event: `Task received: ${message}`,
        type: 'info',
        timestamp
      });
    } else {
      // Handle regular chat mode
      // Check if this is an example query
      if (message in EXAMPLE_RESPONSES) {
        addSystemEvent({
          event: "Processing example scenario",
          type: "info",
        });

        for (const response of EXAMPLE_RESPONSES[message]) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setMessages((prev) => [
            ...prev,
            {
              ...response,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);

          addSystemEvent({
            event: `${response.agentName} providing ${response.collaborationType}`,
            agent: response.agentName,
            type: "info",
          });
        }

        addSystemEvent({
          event: "Example scenario completed",
          type: "success",
        });

        return;
      }

      addSystemEvent({
        event: "Starting agent collaboration",
        type: "info",
      });

      const portfolioAgent = agents.find((agent) => agent.id === "portfolio");
      const initialAnalysis = await portfolioAgent?.agent?.invoke(
        {
          input: `Analyze this request and determine which other agents should be involved: ${message}`,
        },
        { configurable: { sessionId: "user-1" } }
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: initialAnalysis.output,
          timestamp: new Date().toLocaleTimeString(),
          agentId: "portfolio",
          agentName: "Portfolio Manager",
          collaborationType: "analysis",
        },
      ]);

      const relevantAgents = agents.filter((agent) => {
        const messageContent = message.toLowerCase();
        return (
          (messageContent.includes("trade") && agent.id === "trading") ||
          (messageContent.includes("liquidity") && agent.id === "liquidity") ||
          (messageContent.includes("analytics") &&
            agent.id === "defi-analytics")
        );
      });

      console.log(relevantAgents, "relevantAgents selected are");

      for (const agent of relevantAgents) {
        const agentResponse = await agent?.agent?.invoke(
          {
            input: `Given the user request "${message}" and portfolio analysis "${initialAnalysis.output}", what is your perspective and recommendation?`,
          },
          { configurable: { sessionId: "user-1" } }
        );

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: agentResponse.output,
            timestamp: new Date().toLocaleTimeString(),
            agentId: agent.id,
            agentName: agent.name,
            collaborationType: "suggestion",
          },
        ]);
      }

      const finalConsensus = await portfolioAgent?.agent?.invoke(
        {
          input: `Based on all suggestions, provide a final recommendation for: ${message}`,
        },
        { configurable: { sessionId: "user-1" } }
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: finalConsensus.output,
          timestamp: new Date().toLocaleTimeString(),
          agentId: "portfolio",
          agentName: "Portfolio Manager",
          collaborationType: "decision",
        },
      ]);
    }
  };

  const addSystemEvent = (
    event: Omit<AgentState["systemEvents"][0], "timestamp">
  ) => {
    setAgentState((prev) => ({
      ...prev,
      systemEvents: [
        ...prev.systemEvents,
        {
          ...event,
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || agentState.isProcessing) return;
    handleMessage(input);
    setInput("");
  };

  return (
    <main className="flex my-16">
      <div>
        <button onClick={handleSendMessage}>Send Message</button>
      </div>
      {/* Left Sidebar - Agent Details */}
      <div className="w-1/4 border-r border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Available Agents</h2>
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`p-4 mb-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${agentState.activeAgent === agent.id
              ? "bg-blue-50 border border-blue-200"
              : "bg-white border"
              }`}
          >
            <div className="flex items-center mb-2">
              <div className="relative w-12 h-12 mr-3">
                <Image
                  src={agentImages[agent.id as keyof typeof agentImages]}
                  alt={agent.name}
                  fill
                  className="rounded-full object-cover"
                  priority
                />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{agent.name}</h3>
                <p className="text-xs text-gray-500">AI Assistant</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{agent.description}</p>
            {agentState.activeAgent === agent.id && (
              <div className="mt-2 text-xs text-blue-600 flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></span>
                Active
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Center - Chat Interface */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`flex items-start max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
              >
                {/* Agent/User Icon */}
                <div
                  className={`flex-shrink-0 ${message.role === "user" ? "ml-2" : "mr-2"}`}
                >
                  {message.role === "user" ? (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      {message.collaborationType && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500" />
                      )}
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div
                  className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
                >
                  {message.agentName && (
                    <span className="text-xs font-medium text-gray-500 mb-1">
                      {message.agentName}
                      {message.collaborationType &&
                        ` • ${message.collaborationType}`}
                    </span>
                  )}
                  <div
                    className={`p-3 rounded-lg ${message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                      }`}
                  >
                    {message.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {message.timestamp}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-end gap-2">
              <label className="text-sm text-gray-600">Autonomous Mode</label>
              <Switch
                checked={autonomousMode}
                onCheckedChange={setAutonomousMode}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>

            {/* Existing input field and button */}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 rounded-lg border p-2"
                placeholder="Type your message..."
              />
              <Button type="submit" disabled={agentState.isProcessing}>
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Right Sidebar - System Events */}
      <div className="w-1/4 border-l border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">System Events</h2>
        {agentState.systemEvents.map((event, index) => (
          <div
            key={index}
            className={`p-3 mb-2 rounded-lg ${event.type === "error"
              ? "bg-red-100"
              : event.type === "success"
                ? "bg-green-100"
                : event.type === "warning"
                  ? "bg-yellow-100"
                  : "bg-blue-100"
              }`}
          >
            <div className="text-sm font-medium">
              {event.agent && (
                <span className="text-gray-600">[{event.agent}] </span>
              )}
              <span className="text-gray-900">{event.event}</span>
            </div>
            <div className="text-xs text-gray-500">{event.timestamp}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
