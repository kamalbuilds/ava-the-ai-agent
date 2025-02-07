"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { initializeAgents } from "./agents";
import { SendHorizontal, Bot, User, PanelRightClose, PanelRightOpen } from "lucide-react";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { EXAMPLE_RESPONSES , AUTONOMOUS_EXAMPLES} from "../lib/example";
import { EventBus } from "./types/event-bus";
import { WebSocketEventBus } from "./services/websocket-event-bus";
import {Navbar} from "@/components/ui/navbar";
import {Footer} from "@/components/ui/footer";
import { useSettingsStore } from './stores/settingsStore';

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

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.4);
  }
`;

export default function Home() {
  const { settings } = useSettingsStore();
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
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);

  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const agentRef = useRef<any>(null);
  const eventBusRef = useRef<EventBus | null>(null);
  const agentsRef = useRef<any>(null);
  const ws = useRef<WebSocket | null>(null);
  const [wsEventBus, setWsEventBus] = useState<WebSocketEventBus | null>(null);

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
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/messages');
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    
    fetchMessages();
  }, []);

  useEffect(() => {
    const eventBus = new WebSocketEventBus();
    eventBusRef.current = eventBus;
    eventBus.connect("ws://localhost:3002");
    subscribeToAgentEvents();
  }, []);

  const subscribeToAgentEvents = () => {
    if (!eventBusRef.current) return;

    // Handle system events for right sidebar
    eventBusRef.current.subscribe('agent-event', (data: any) => {
      addSystemEvent({
        event: data.action,
        agent: data.agent,
        type: data.eventType || 'info',
        timestamp: data.timestamp
      });
    });

    // Handle agent messages for chat and persist to API
    eventBusRef.current.subscribe('agent-message', async (data: any) => {
      const message = {
        role: data.role,
        content: data.content,
        timestamp: data.timestamp || new Date().toISOString(),
        agentId: data.agentId,
        agentName: data.agentName,
        collaborationType: data.collaborationType
      };

      // Add message to UI state
      setMessages(prev => [...prev, message]);

      // Persist message to API
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to persist message:', errorText);
        }
      } catch (error) {
        console.error('Error persisting message:', error);
      }
    });
  };

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

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    try {
      // Save user message to MongoDB
      await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userMessage),
      });

      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      // Your existing agent processing logic here
      if (agentRef.current) {
        const response = await agentRef.current.processUserInput(input);
        
        if (response) {
          const assistantMessage: Message = {
            role: 'assistant',
            content: response.content,
            timestamp: new Date().toISOString(),
            agentId: response.agentId,
            agentName: response.agentName,
            collaborationType: response.collaborationType,
          };

          // Save assistant message to MongoDB
          await fetch('/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(assistantMessage),
          });

          setMessages((prev) => [...prev, assistantMessage]);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
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

  const enableAutonomousMode = async () => {
    if (!wsEventBus || !settings.aiProvider.apiKey) {
      console.error('WebSocket not connected or API key not set');
      return;
    }

    try {
      // Send saved settings to server when autonomous mode is enabled
      wsEventBus.emit('settings', {
        settings: {
          aiProvider: {
            provider: settings.aiProvider.provider,
            apiKey: settings.aiProvider.apiKey,
            modelName: settings.aiProvider.modelName
          },
          enablePrivateCompute: settings.enablePrivateCompute
        }
      });

      // Initialize autonomous mode
      wsEventBus.emit('command', {
        command: 'start',
        settings: settings // Pass full settings context
      });

      setAutonomousMode(true);
      
      setAgentState(prev => ({
        ...prev,
        systemEvents: [...prev.systemEvents, {
          timestamp: new Date().toLocaleTimeString(),
          event: "Autonomous mode enabled",
          type: "success"
        }]
      }));

    } catch (error) {
      console.error('Failed to enable autonomous mode:', error);
      setAgentState(prev => ({
        ...prev,
        systemEvents: [...prev.systemEvents, {
          timestamp: new Date().toLocaleTimeString(),
          event: "Failed to enable autonomous mode",
          type: "error"
        }]
      }));
    }
  };

  useEffect(() => {
    const eventBus = new WebSocketEventBus();
    setWsEventBus(eventBus);

    // Subscribe to agent messages with deduplication
    const seenMessages = new Set<string>();
    
    eventBus.subscribe('agent-message', (data) => {
      const messageKey = `${data.timestamp}-${data.content}`;
      if (seenMessages.has(messageKey)) return;
      
      seenMessages.add(messageKey);
      setMessages(prev => [...prev, {
        role: data.role,
        content: data.content,
        timestamp: data.timestamp,
        agentName: data.agentName,
        collaborationType: data.collaborationType
      }]);
    });

    // Subscribe to agent events with deduplication
    const seenEvents = new Set<string>();
    
    eventBus.subscribe('agent-event', (data) => {
      const eventKey = `${data.timestamp}-${data.action}`;
      if (seenEvents.has(eventKey)) return;
      
      seenEvents.add(eventKey);
      setAgentState(prev => ({
        ...prev,
        systemEvents: [...prev.systemEvents, {
          timestamp: data.timestamp,
          event: data.action,
          agent: data.agent,
          type: data.eventType
        }]
      }));
    });

    // Subscribe to executor responses
    eventBus.subscribe('executor-response', (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.report || data.result,
        timestamp: new Date().toLocaleTimeString(),
        agentName: 'executor',
        collaborationType: 'execution'
      }]);
    });

    return () => {
      eventBus.unsubscribe('agent-message', () => {});
      eventBus.unsubscribe('agent-event', () => {});
      eventBus.unsubscribe('executor-response', () => {});
    };
  }, []);

  return (
  <>
    <div className="flex flex-col min-h-screen">
      <style jsx global>{scrollbarStyles}</style>
      <Navbar />
      
      <main className="flex flex-1 overflow-hidden pt-16 pb-16">
        {/* Left Sidebar - Agent Details */}
        <div className="w-1/4 border-r border-white/10 overflow-y-auto custom-scrollbar">
          <div className="p-4">
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
        </div>

        {/* Center - Chat Interface */}
        <div className="flex-1 flex flex-col">
          {/* Messages Container */}
          <div 
            className="flex-1 overflow-y-auto p-4 custom-scrollbar"
            style={{ 
              height: 'calc(100vh - 280px)',
              maxHeight: 'calc(100vh - 280px)'
            }}
          >
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

          {/* Input Form */}
          <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
            <form onSubmit={(e) => e.preventDefault()} className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-end gap-2">
                  <label className="text-sm text-gray-600">Autonomous Mode</label>
                  <Switch
                    checked={autonomousMode}
                    onCheckedChange={enableAutonomousMode}
                    disabled={!settings.aiProvider.apiKey}
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 rounded-lg border p-2"
                    placeholder="Type your message..."
                  />
                  <Button type="button" onClick={handleSubmit} disabled={agentState.isProcessing}>
                    <SendHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Sidebar - System Events */}
        <div 
          className={`transition-all duration-300 flex flex-col border-l border-white/10 ${
            isRightSidebarOpen ? 'w-1/4' : 'w-[40px]'
          }`}
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            {isRightSidebarOpen && (
              <h2 className="text-lg font-semibold">System Events</h2>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
              title={isRightSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isRightSidebarOpen ? (
                <PanelRightClose className="h-5 w-5 text-gray-600 hover:text-gray-900" />
              ) : (
                <PanelRightOpen className="h-5 w-5 text-gray-600 hover:text-gray-900" />
              )}
            </Button>
          </div>
          
          {isRightSidebarOpen && (
            <div 
              className="flex-1 overflow-y-auto p-4 custom-scrollbar"
              style={{ 
                height: 'calc(100vh - 280px)',
                maxHeight: 'calc(100vh - 280px)'
              }}
            >
              {agentState.systemEvents.map((event, index) => (
                <div
                  key={index}
                  className={`p-3 mb-2 rounded-lg ${
                    event.type === "error"
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
          )}
        </div>
      </main>

      <Footer />
    </div>
    </>
  );
}
