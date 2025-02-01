"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { initializeAgents } from "./agents";
import { SendHorizontal, Bot, User } from "lucide-react";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { EXAMPLE_RESPONSES } from "../lib/example";
import { EventBus } from "./types/event-bus";
import { WebSocketEventBus } from "./services/websocket-event-bus";
import {Navbar} from "@/components/ui/navbar";
import {Footer} from "@/components/ui/footer";

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

// autonom mode examples to train ai
const AUTONOMOUS_EXAMPLES = {
  "Portfolio Rebalancing": {
    query: "I have $200 in my wallet on Mantle. Can you analyze my portfolio and suggest optimizations?",
    systemPrompt: "Initiating comprehensive DeFi portfolio analysis on Mantle network",
    responses: [
      {
        role: "assistant",
        content: "📊 DeFi Portfolio Report - Mantle Network\n\nCurrent Portfolio ($200):\n- USDC: $120 (60%)\n- WETH: $50 (25%)\n- MNT: $30 (15%)\n\nKey Market Insights:\n- Stargate finance is up 10% this week\n- WETH/USDC pool APY: 15.2%\n- MNT staking rewards: 8.5% APR\n- Agni Finance lending rates: USDC 5.8%, WETH 3.2%",
        agentName: "Observer Agent",
        collaborationType: "analysis",
        timestamp: ""
      },
      {
        role: "assistant",
        content: "Task Analysis: Portfolio requires rebalancing to maximize yield. Current allocation is too conservative with high USDC holdings. Identified opportunities in Agni Finance and Mantle DEX pools.",
        agentName: "Task Manager",
        collaborationType: "analysis",
        timestamp: ""
      },
      {
        role: "assistant",
        content: "hey anon, i've been watching these pools closely. the mETH-USDT pool on mantle dex is pretty based rn. impermanent loss risk is minimal given the price correlation. might be worth aping a bit more into that.",
        agentName: "Eliza",
        collaborationType: "suggestion",
        timestamp: ""
      },
      {
        role: "assistant",
        content: "Executing rebalancing strategy:\n1. Converting $25 USDC to mETH  via Squid Router \n2. Adding mETH-USDC liquidity position ($50)\n3. Swapping remaining USDC ($70) and Depositing into Agni Finance mETH-USDT lending pool\n\nNew Portfolio Allocation:\n- mETH-USDC LP: $80 (40%) - Est. APY 18.5%\n- USDC lending: $70 (35%) - APY 5.8%\n- MNT: $50 (25%) - Staking APR 8.5%\n\nExpected Portfolio Yield: ~12.4% APY",
        agentName: "Executor Agent",
        collaborationType: "execution",
        timestamp: ""
      }
    ]
  },
  "Liquidity Provisioning": {
    query: "What's the best way to provide liquidity with my $200 on Mantle DEX?",
    systemPrompt: "Analyzing Mantle DEX liquidity pools and market conditions",
    responses: [
      {
        role: "assistant",
        content: "🔍 Mantle DEX Liquidity Analysis\n\nTop Performing Pools:\n1. WETH/USDC: $2.5M TVL, 15.2% APY\n2. MNT/USDC: $1.8M TVL, 12.8% APY\n3. WETH/MNT: $1.2M TVL, 18.5% APY\n\nRisk Metrics:\n- Price correlation: WETH/MNT (0.85)\n- 24h Volume: $1.2M\n- IL Risk: Low-Medium",
        agentName: "Observer Agent",
        collaborationType: "analysis",
        timestamp: ""
      },
      {
        role: "assistant",
        content: "looks like you're interested in LP farming anon. i've been monitoring these pools and the WETH/MNT pair is pretty solid. fees are bussin and IL hasn't been too bad. degen play would be the new wmnt/usdc pool but that's more risky.",
        agentName: "Eliza",
        collaborationType: "suggestion",
        timestamp: ""
      },
      {
        role: "assistant",
        content: "Recommended Strategy: Split liquidity between WETH/MNT and USDC/MNT pools to diversify risk while maximizing returns. Current market conditions favor balanced exposure to both pairs.",
        agentName: "Task Manager",
        collaborationType: "suggestion",
        timestamp: ""
      },
      {
        role: "assistant",
        content: "Executing liquidity provision strategy:\n\n1. Split funds:\n   - $100 to WETH/MNT pool\n   - $100 to USDC/MNT pool\n\n2. Transactions completed:\n   - Swapped $50 to WETH\n   - Swapped $100 to MNT\n   - Added liquidity positions\n\nFinal Position:\n- WETH/MNT LP: $100 (Est. APY 18.5%)\n- USDC/MNT LP: $100 (Est. APY 12.8%)\n\nTotal Expected Yield: ~15.65% APY\nTransaction fees paid: $0.85",
        agentName: "Executor Agent",
        collaborationType: "execution",
        timestamp: ""
      }
    ]
  },
  "Yield Farming": {
    query: "Find me the best yield farming strategy for $200 on Mantle",
    systemPrompt: "Analyzing yield farming opportunities across Mantle DeFi protocols",
    responses: [
      {
        role: "assistant",
        content: "📈 Yield Farming Opportunities Report\n\nProtocol APYs:\n1. Agni Finance\n   - USDC Lending: 5.8%\n   - WETH Lending: 3.2%\n   - MNT Farming: 14.5%\n\n2. Mantle DEX\n   - WETH/MNT LP + Rewards: 18.5%\n   - USDC/MNT LP + Rewards: 12.8%\n\n3. Fusionist\n   - NFT Staking: 22% (requires NFT)\n   - Token Staking: 16.2%",
        agentName: "Observer Agent",
        collaborationType: "analysis",
        timestamp: ""
      },
      {
        role: "assistant",
        content: "yo fren, been farming on mantle since launch. fusionist's looking pretty juicy rn but you need their nft. agni x mantle dex combo is the 200iq play - stack those yields without the nft requirement.",
        agentName: "Eliza",
        collaborationType: "suggestion",
        timestamp: ""
      },
      {
        role: "assistant",
        content: "Optimal Strategy Identified: Leverage Agni Finance lending with Mantle DEX farming for maximum yields. Will implement multi-step yield farming position.",
        agentName: "Task Manager",
        collaborationType: "suggestion",
        timestamp: ""
      },
      {
        role: "assistant",
        content: "Executing yield farming strategy:\n\n1. Initial Setup:\n   - Deposited $100 USDC in Agni Finance (5.8% APY)\n   - Borrowed $50 MNT against USDC (2.5% interest)\n\n2. Liquidity Position:\n   - Added $100 + borrowed $50 to WETH/MNT LP\n   - Staked LP tokens for additional rewards\n\nFinal Position:\n- Agni Finance Lending: $100 (5.8% APY)\n- WETH/MNT LP + Rewards: $150 (18.5% APY)\n- Net APY after borrowing costs: ~16.2%\n\nTotal Expected Annual Yield: $32.40 (16.2%)\nPosition can be boosted through reward token compounding",
        agentName: "Executor Agent",
        collaborationType: "execution",
        timestamp: ""
      }
    ]
  }
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
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Add pt-16 to account for fixed navbar height and pb-16 for footer */}
      <main className="flex flex-1 overflow-hidden pt-16 pb-16">
        {/* Left Sidebar - Agent Details */}
        <div className="w-1/4 border-r border-white/10 overflow-y-auto">
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
        <div className="flex-1 flex flex-col h-full">
          {/* Messages Container */}
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

          {/* Input Form - Fixed at bottom of chat area */}
          <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="p-4">
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
        </div>

        {/* Right Sidebar - System Events */}
        <div className="w-1/4 border-l border-white/10 overflow-y-auto">
          <div className="p-4">
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
