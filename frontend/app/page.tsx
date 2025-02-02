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
import { EventBus } from "./types/event-bus";
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
              "Hello! I'm Ava, your AI portfolio manager. I can help you manage your DeFi portfolio across Multiple Chains. What would you like to do?",
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

    // Handle system events for right sidebar
    eventBusRef.current.subscribe('agent-event', (data: any) => {
      console.log(data, "data received from agent event");
      addSystemEvent({
        event: data.action,
        agent: data.agent,
        type: data.eventType || 'info',
        timestamp: data.timestamp
      });
    });

    // Handle agent messages for chat
    eventBusRef.current.subscribe('agent-message', (data: any) => {
      setMessages(prev => [...prev, {
        role: data.role,
        content: data.content,
        timestamp: data.timestamp,
        agentName: data.agentName,
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
      // Send command to autonomous agents
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
      setMessages(prev => [...prev, {
        role: 'user',
        content: message,
        timestamp: new Date().toLocaleTimeString()
      }]);

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
              timestamp: new Date().toLocaleTimeString(),
              ...response,
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
          (messageContent.includes("analytics") && agent.id === "defi-analytics")
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
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex-none p-4 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6" />
            <h2 className="text-xl font-bold">Ava - AI Portfolio Manager</h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm">Autonomous Mode</span>
            <Switch
              checked={autonomousMode}
              onCheckedChange={setAutonomousMode}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/4 p-4 overflow-y-auto border-r">
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

        <div className="flex flex-col flex-1">
          <div
            className="flex-1 p-4 overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 280px)' }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start space-x-2 mb-4 ${message.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                {message.role !== "user" && (
                  <div className="flex-shrink-0">
                    <Bot className="w-6 h-6" />
                  </div>
                )}
                <Card
                  className={`p-3 max-w-[80%] ${message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : ""
                    }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp}
                  </span>
                </Card>
                {message.role === "user" && (
                  <div className="flex-shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-none p-4 bg-background border-t mb-[200px]">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                type="submit"
                disabled={!input.trim() || agentState.isProcessing}
              >
                <SendHorizontal className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        <div className="w-1/4 p-4 overflow-y-auto border-l">
          {/* System events section */}
          <h3 className="font-semibold mb-2">System Events</h3>
          <div className="space-y-2">
            {agentState.systemEvents.map((event, index) => (
              <div
                key={index}
                className={`p-2 rounded text-sm ${event.type === "error"
                  ? "bg-red-100 text-red-800"
                  : event.type === "warning"
                    ? "bg-yellow-100 text-yellow-800"
                    : event.type === "success"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
              >
                <div className="font-medium">{event.event}</div>
                <div className="text-xs opacity-70">{event.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
