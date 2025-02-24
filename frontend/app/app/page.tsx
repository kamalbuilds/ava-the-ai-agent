"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { initializeAgents } from "../agents";
import { SendHorizontal, Bot, User, PanelRightClose, PanelRightOpen } from "lucide-react";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { EXAMPLE_RESPONSES , AUTONOMOUS_EXAMPLES} from "../../lib/example";
import { EventBus } from "../types/event-bus";
import { WebSocketEventBus } from "../services/websocket-event-bus";
import {Navbar} from "@/components/ui/navbar";
import {Footer} from "@/components/ui/footer";
import { useSettingsStore } from '../stores/settingsStore';

// Add a mapping for agent images
const agentImages = {
  trading: "/agent_trader.png",
  liquidity: "/agent_liquidity.png",
  portfolio: "/agent_default.png",
  "defi-analytics": "/agent_analyst.png",
  default: "/agent_default.png", // Add a default image
};

console.log(agentImages,"agentImages");

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

// Add this helper function at the top level
const deduplicateMessages = (messages: Message[]): Message[] => {
  const seen = new Set<string>();
  return messages.filter(message => {
    const key = `${message.timestamp}-${message.content}-${message.agentName || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Add this interface at the top with other interfaces
interface SystemEvent {
  timestamp: string;
  event: string;
  agent?: string | undefined;
  type: "info" | "warning" | "error" | "success";
}

interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  agentName?: string;
  collaborationType?: CollaborationType;
  type?: string;
  action?: string;
  event?: string;
  eventType?: "info" | "warning" | "error" | "success";
}

// Speech queue management
const speechQueue: { text: string; resolve: () => void }[] = [];
let isSpeaking = false;

const processSpeechQueue = async () => {
  if (isSpeaking || speechQueue.length === 0) return;
  isSpeaking = true;
  const { text, resolve } = speechQueue[0];
  
  try {
    const audioData = await convertToSpeech(text);
    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    const base64data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    const audio = new Audio(base64data);
    await new Promise((resolvePlay) => {
      audio.onended = () => resolvePlay();
      audio.play().catch(console.error);
    });
  } catch (error) {
    console.error("Error in speech synthesis:", error);
  } finally {
    speechQueue.shift();
    isSpeaking = false;
    resolve();
    processSpeechQueue();
  }
};

const addToSpeechQueue = async (text: string): Promise<void> => {
  return new Promise((resolve) => {
    speechQueue.push({ text, resolve });
    processSpeechQueue();
  });
};

const convertToSpeech = async (text: string): Promise<Uint8Array> => {
  try {
    console.log("Starting text-to-speech conversion with text:", text);
    
    const API_KEY = 'sk_ce8270a67aa44352ebda95e6730eee33cb799490e739748f';
    const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';
    
    // Make direct fetch request to ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY.trim()
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      console.error('ElevenLabs API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorDetails: errorText,
        requestHeaders: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': 'sk_****' // Masked for logging
        }
      });
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}\nDetails: ${errorText}`);
    }

    // Get the response as ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    console.log("Got response from ElevenLabs API, size:", arrayBuffer.byteLength);
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Received empty response from ElevenLabs API');
    }
    
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error("Error in convertToSpeech:", error);
    throw error;
  }
};

// Test function with a very short text
const testElevenLabs = async () => {
  try {
    console.log("Testing ElevenLabs API...");
    const testText = "Test.";
    
    const audioData = await convertToSpeech(testText);
    console.log("Test successful! Got audio data of size:", audioData.length);
    
    // Create blob with explicit MIME type
    const blob = new Blob([audioData], { 
      type: 'audio/mpeg'
    });
    
    // Convert to base64
    const base64data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    console.log("Created base64 audio data for test");
    
    // Create and play audio
    const audio = new Audio();
    
    // Set up event listeners
    audio.addEventListener('loadeddata', () => console.log('Test audio data loaded'));
    audio.addEventListener('error', (e) => console.error('Test audio loading error:', e));
    audio.addEventListener('playing', () => console.log('Test audio started playing'));
    audio.addEventListener('ended', () => console.log('Test audio finished playing'));
    
    // Set the source and play
    audio.src = base64data;
    
    try {
      await audio.play();
      console.log("Test audio playing!");
    } catch (playError) {
      console.error("Test audio playback failed:", playError);
    }
  } catch (error) {
    console.error("ElevenLabs test failed:", error);
  }
};

type CollaborationType =
  | "analysis"
  | "execution"
  | "report"
  | "question"
  | "response"
  | "suggestion"
  | "decision"
  | "simulation"
  | "transaction"
  | "tool-result"
  | "handoff"
  | "task-creation";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  agentName?: string | undefined;
  collaborationType?: CollaborationType | undefined;
  audioUrl?: string;
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

export default function Home() {
  const { settings } = useSettingsStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  
  // Sample prompts data
  const samplePrompts = [
    { icon: "💱", text: "Swap 1 USDC to WETH" },
    { icon: "📈", text: "Create investment plan for 5 SOL to make 7 SOL" },
    { icon: "🔄", text: "Bridge 2 ETH to Polygon" },
    { icon: "💰", text: "Find best yield farming opportunities" },
    { icon: "📊", text: "Analyze my portfolio performance" },
    { icon: "📉", text: "Show price chart for PEPE" },
    { icon: "🏦", text: "Deposit 100 USDC to Aave" },
    { icon: "💎", text: "Find undervalued NFT collections" },
    { icon: "🔍", text: "Check my wallet health" },
    { icon: "⚡", text: "Find gas-optimized DEX route" }
  ];

  const [showAllPrompts, setShowAllPrompts] = useState(false);

  const visiblePrompts = showAllPrompts ? samplePrompts : samplePrompts.slice(0, 4);

  const handlePromptClick = (promptText: string) => {
    setInput(promptText);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || agentState.isProcessing) return;
    handleMessage(input);
    setInput("");
  };

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
        console.log(agents, "initializedAgents");

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
              "Hello! I'm Ava, your AI portfolio manager. I can help you manage your DeFi portfolio across multiple chains. What would you like to do?",
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
      eventBus.connect(process.env['NEXT_PUBLIC_WEBSOCKET_URL'] || 'ws://localhost:3002');

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

    eventBus.connect(process.env['NEXT_PUBLIC_WEBSOCKET_URL'] || 'ws://localhost:3002');

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

    // Add user message with deduplication
    setMessages(prev => {
      const newMessage = {
        role: 'user',
        content: message,
        timestamp
      };
      const updatedMessages = [...prev, newMessage];
      return deduplicateMessages(updatedMessages);
    });

    if (autonomousMode) {
      // Check if this is an example query
      const example = Object.values(AUTONOMOUS_EXAMPLES).find(ex => ex.query === message);

      if (example) {
        addSystemEvent({
          event: "Processing given scenario",
          type: "info",
        });

        // Add system prompt
        addSystemEvent({
          event: example.systemPrompt,
          type: "info",
          timestamp
        });

        // Simulate responses with delays
        for (const response of example.responses) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          setMessages(prev => [...prev, {
            ...response,
            timestamp: new Date().toLocaleTimeString()
          }]);

          addSystemEvent({
            event: `${response.agentName} providing ${response.collaborationType}`,
            agent: response.agentName,
            type: "info"
          });
        }

        addSystemEvent({
          event: "Task completed successfully",
          type: "success"
        });
        return;
      }

      // Continue with regular autonomous mode handling
      eventBusRef.current?.emit('command', {
        type: 'command',
        command: message
      });

      addSystemEvent({
        event: `Task received: ${message}`,
        type: 'info',
        timestamp
      });

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

      await handleAgentResponse({
        content: initialAnalysis.output,
        agentName: "Portfolio Manager",
        type: "analysis"
      });

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

        await handleAgentResponse({
          content: agentResponse.output,
          agentName: agent.name,
          type: "suggestion"
        });
      }

      const finalConsensus = await portfolioAgent?.agent?.invoke(
        {
          input: `Based on all suggestions, provide a final recommendation for: ${message}`,
        },
        { configurable: { sessionId: "user-1" } }
      );

      await handleAgentResponse({
        content: finalConsensus.output,
        agentName: "Portfolio Manager",
        type: "decision"
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
          event: "Task completed successfully",
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

      await handleAgentResponse({
        content: initialAnalysis.output,
        agentName: "Portfolio Manager",
        type: "analysis"
      });

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

        await handleAgentResponse({
          content: agentResponse.output,
          agentName: agent.name,
          type: "suggestion"
        });
      }

      const finalConsensus = await portfolioAgent?.agent?.invoke(
        {
          input: `Based on all suggestions, provide a final recommendation for: ${message}`,
        },
        { configurable: { sessionId: "user-1" } }
      );

      await handleAgentResponse({
        content: finalConsensus.output,
        agentName: "Portfolio Manager",
        type: "decision"
      });
    }
  };

  const handleAgentResponse = async (response: any) => {
    try {
      const newMessage: Message = {
        role: "assistant",
        content: response.message || response.content,
        timestamp: new Date().toISOString(),
        agentName: response.agentName || activeAgent,
        collaborationType: response.type as CollaborationType,
      };
      setMessages(prev => deduplicateMessages([...prev, newMessage]));
      await new Promise(r => setTimeout(r, 100));
      if (isTTSEnabled) await addToSpeechQueue(newMessage.content);
    } catch (error) {
      console.error("Error handling agent response:", error);
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

  const initializeAutonomousMode = async () => {
    if (!wsEventBus) return;

    try {
      wsEventBus.emit('command', {
        command: 'start',
        settings: {
          aiProvider: settings.aiProvider,
          enablePrivateCompute: settings.enablePrivateCompute
        }
      });
    } catch (error) {
      console.error('Failed to initialize autonomous mode:', error);
      throw error;
    }
  };

  const enableAutonomousMode = async () => {
    if (!wsEventBus) return;

    try {
      // Send settings to server
      wsEventBus.emit('settings', {
        settings: {
          aiProvider: settings.aiProvider,
          enablePrivateCompute: settings.enablePrivateCompute
        }
      });

      // Initialize agents
      await initializeAutonomousMode();

      // Enable autonomous mode
      setAutonomousMode(true);
    } catch (error) {
      console.error('Failed to enable autonomous mode:', error);
    }
  };

  useEffect(() => {
    const eventBus = new WebSocketEventBus();
    setWsEventBus(eventBus);

    // Subscribe to agent messages
    eventBus.subscribe('agent-message', (data: AgentMessage) => {
      const newMessage: Message = {
        role: data.role,
        content: data.content,
        timestamp: data.timestamp || new Date().toLocaleTimeString(),
        agentName: data.agentName,
        collaborationType: data.collaborationType
      };

      setMessages(prev => {
        const updatedMessages = [...prev, newMessage];
        return deduplicateMessages(updatedMessages);
      });
    });

    // Subscribe to system events
    eventBus.subscribe('agent-event', (data: AgentMessage) => {
      const newEvent: SystemEvent = {
        timestamp: data.timestamp || new Date().toLocaleTimeString(),
        event: data.action || data.event || '',
        agent: data.agentName,
        type: data.eventType || 'info'
      };

      setAgentState(prev => ({
        ...prev,
        systemEvents: [...prev.systemEvents, newEvent]
      }));
    });

    // Subscribe to executor responses
    eventBus.subscribe('executor-response', (data: { report?: string; result?: string }) => {
      const newMessage: Message = {
        role: 'assistant',
        content: data.report || data.result || '',
        timestamp: new Date().toLocaleTimeString(),
        agentName: 'Executor',
        collaborationType: 'execution'
      };

      setMessages(prev => {
        const updatedMessages = [...prev, newMessage];
        return deduplicateMessages(updatedMessages);
      });
    });

    return () => {
      eventBus.disconnect();
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
                      src={agentImages[agent.id as keyof typeof agentImages] || agentImages.default}
                      alt={`${agent.name} avatar`}
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
        <div className="flex-1 flex flex-col bg-[#0A192F]">
          {/* Messages Container */}
          <div 
            className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0A192F"
            style={{ 
              height: 'calc(100vh - 280px)',
              maxHeight: 'calc(100vh - 280px)'
            }}
          >
            {messages.map((message, index) => (
              <div
                key={`${message.timestamp}-${index}`}
                className={`mb-4 flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-start max-w-[80%] ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Agent/User Icon */}
                  <div className={`flex-shrink-0 ${message.role === "user" ? "ml-2" : "mr-2"}`}>
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
                  <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                    {message.agentName && (
                      <span className="text-xs font-medium text-gray-500 mb-1">
                        {message.agentName}
                        {message.collaborationType && ` • ${message.collaborationType}`}
                      </span>
                    )}
                    <div
                      className={`p-3 rounded-lg ${
                        message.role === "user"
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
          <div className="border-t border-white/10">
            <form onSubmit={handleSubmit} className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={autonomousMode}
                        onCheckedChange={setAutonomousMode}
                        id="autonomous-mode"
                      />
                      <label
                        htmlFor="autonomous-mode"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Autonomous Mode
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={isTTSEnabled}
                        onCheckedChange={setIsTTSEnabled}
                        id="tts-mode"
                      />
                      <label
                        htmlFor="tts-mode"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Text to Speech
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 rounded-lg border border-white/10 bg-black/20 p-2 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your message..."
                  />
                  <Button type="submit" disabled={agentState.isProcessing}>
                    <SendHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
            
            {/* Sample Prompts Section */}
            <div className="flex flex-wrap gap-2 mb-4 p-4">
              {visiblePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handlePromptClick(prompt.text)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-black/20 hover:bg-black/30 text-gray-300 rounded-lg transition-colors duration-200 backdrop-blur-sm border border-white/10"
                >
                  <span>{prompt.icon}</span>
                  <span>{prompt.text}</span>
                </button>
              ))}
              <button
                onClick={() => setShowAllPrompts(!showAllPrompts)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-black/20 hover:bg-black/30 text-gray-300 rounded-lg transition-colors duration-200 backdrop-blur-sm border border-white/10"
              >
                <span>ℹ️</span>
                <span>{showAllPrompts ? 'Less' : 'More'}</span>
              </button>
            </div>
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