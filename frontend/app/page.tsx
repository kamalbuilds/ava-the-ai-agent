"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createBrianAgent } from "@brian-ai/langchain";
import { ChatOpenAI } from "@langchain/openai";
import { Client } from "@xmtp/xmtp-js";
import { ethers } from "ethers";
import { BrianToolkit } from "@brian-ai/langchain";
import { AvalancheConfig } from "@brian-ai/langchain/chains";
import { initializeAgents } from "./agents";
import { SendHorizontal, Bot, User } from "lucide-react";
import { AgentCharacters } from "./agents/AgentCharacters";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
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
    type: 'info' | 'warning' | 'error' | 'success';
  }>;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  message?: string;
  agent?: any;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [agentState, setAgentState] = useState<AgentState>({
    isInitialized: false,
    isProcessing: false,
    error: null,
    activeAgent: null,
    systemEvents: []
  });
  const [agents, setAgents] = useState<Agent[]>([]);

  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const agentRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const setupAgents = async () => {
      try {
        setAgentState(prev => ({
          ...prev,
          isProcessing: true,
          systemEvents: [...prev.systemEvents, {
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            event: 'Initializing AI agents...',
            type: 'info'
          }]
        }));

        const initializedAgents = await initializeAgents();
        setAgents(initializedAgents);

        setAgentState(prev => ({
          ...prev,
          isInitialized: true,
          systemEvents: [...prev.systemEvents, {
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            event: 'AI agents initialized successfully',
            type: 'success'
          }]
        }));

        setMessages([{
          role: "assistant",
          content: "Hello! I'm Ava, your AI portfolio manager. I can help you manage your DeFi portfolio on Avalanche. What would you like to do?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } catch (error) {
        setAgentState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize agents',
          systemEvents: [...prev.systemEvents, {
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            event: `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'error'
          }]
        }));
      } finally {
        setAgentState(prev => ({ ...prev, isProcessing: false }));
      }
    };

    setupAgents();
  }, []);

  const handleMessage = async (message: string) => {
    try {
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, { role: "user", content: message, timestamp }]);

      // Choose appropriate agent based on message content
      let selectedAgent;
      let agentType = '';

      console.log(agents, "agents");

      if (message.toLowerCase().includes('trade') || message.toLowerCase().includes('price')) {
        selectedAgent = agents.find(agent => agent.id === 'trading');
        agentType = 'Trading Agent';
      } else if (message.toLowerCase().includes('pool') || message.toLowerCase().includes('liquidity')) {
        selectedAgent = agents.find(agent => agent.id === 'liquidity');

        agentType = 'Liquidity Agent';
      } else {
        selectedAgent = agents.find(agent => agent.id === 'portfolio');
        agentType = 'Portfolio Agent';
      }

      setAgentState(prev => ({
        ...prev,
        isProcessing: true,
        activeAgent: agentType,
        systemEvents: [...prev.systemEvents, {
          timestamp,
          event: `Processing request using ${agentType}`,
          agent: agentType,
          type: 'info'
        }]
      }));

      console.log(selectedAgent, "selectedAgent is ");

      const response = await selectedAgent?.agent?.invoke(
        { input: message },
        { configurable: { sessionId: "user-1" } }
      );

      setMessages(prev => [...prev, {
        role: "assistant",
        content: response.output,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      setAgentState(prev => ({
        ...prev,
        systemEvents: [...prev.systemEvents, {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          event: `${agentType} completed task successfully`,
          agent: agentType,
          type: 'success'
        }]
      }));
    } catch (error) {
      console.error('Error handling message:', error);
      setMessages(prev => [...prev, {
        role: "system",
        content: "I encountered an error while processing your request. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      setAgentState(prev => ({
        ...prev,
        systemEvents: [...prev.systemEvents, {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          event: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          agent: prev.activeAgent,
          type: 'error'
        }]
      }));
    } finally {
      setAgentState(prev => ({ ...prev, isProcessing: false, activeAgent: null }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || agentState.isProcessing) return;
    handleMessage(input);
    setInput("");
  };

  return (
    <main className="flex  my-16">
      {/* Left Sidebar - Agent Details */}
      <div className="w-1/4 border-r border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Available Agents</h2>
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`p-4 mb-2 rounded-lg cursor-pointer ${agentState.activeAgent === agent.id ? 'bg-blue-100' : 'bg-gray-50'
              }`}
          >
            <h3 className="font-medium text-gray-900">{agent.name}</h3>
            <p className="text-sm text-gray-600">{agent.description}</p>
          </div>
        ))}
      </div>

      {/* Center - Chat Interface */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <div key={index} className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}>
              <div className={`flex items-start max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}>
                {/* Icon container */}
                <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-2' : 'mr-2'
                  }`}>
                  {message.role === 'user' ? (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Message content */}
                <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'
                  }`}>
                  <div className={`p-3 rounded-lg ${message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                    }`}>
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

        {/* Input form */}
        <form onSubmit={handleSubmit} className="border-t p-4">
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
        </form>
      </div>

      {/* Right Sidebar - System Events */}
      <div className="w-1/4 border-l border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">System Events</h2>
        {agentState.systemEvents.map((event, index) => (
          <div
            key={index}
            className={`p-3 mb-2 rounded-lg ${event.type === 'error' ? 'bg-red-100' :
              event.type === 'success' ? 'bg-green-100' :
                event.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
              }`}
          >
            <div className="text-sm font-medium">
              {event.agent && <span className="text-gray-600">[{event.agent}] </span>}
              <span className="text-gray-900">{event.event}</span>
            </div>
            <div className="text-xs text-gray-500">{event.timestamp}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
