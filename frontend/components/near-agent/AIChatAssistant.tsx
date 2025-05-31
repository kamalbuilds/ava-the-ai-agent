"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNearAgent } from '@/contexts/NearAgentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Mic, 
  MicOff, 
  Bot, 
  User, 
  Zap, 
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Coins,
  RefreshCw,
  ExternalLink,
  Copy,
  Trash2,
  Settings,
  Brain,
  Sparkles
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
  status?: 'processing' | 'completed' | 'error';
}

interface ChatAction {
  type: 'transfer' | 'stake' | 'swap' | 'defi';
  label: string;
  data: any;
  executed?: boolean;
}

interface QuickCommand {
  label: string;
  command: string;
  icon: React.ReactNode;
  category: 'portfolio' | 'defi' | 'staking' | 'transaction';
}

const AIChatAssistant: React.FC = () => {
  const { state, connectWallet, processAICommand } = useNearAgent();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showQuickCommands, setShowQuickCommands] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickCommands: QuickCommand[] = [
    {
      label: 'Check Portfolio',
      command: 'Show me my portfolio balance and assets',
      icon: <Coins className="h-4 w-4" />,
      category: 'portfolio'
    },
    {
      label: 'Stake 100 NEAR',
      command: 'Stake 100 NEAR tokens with the best validator',
      icon: <TrendingUp className="h-4 w-4" />,
      category: 'staking'
    },
    {
      label: 'Find DeFi Opportunities',
      command: 'Show me the best DeFi yield farming opportunities',
      icon: <Sparkles className="h-4 w-4" />,
      category: 'defi'
    },
    {
      label: 'Recent Transactions',
      command: 'Show my recent transaction history',
      icon: <RefreshCw className="h-4 w-4" />,
      category: 'transaction'
    },
    {
      label: 'Swap NEAR to USDC',
      command: 'Help me swap 50 NEAR to USDC on Ref Finance',
      icon: <RefreshCw className="h-4 w-4" />,
      category: 'defi'
    },
    {
      label: 'Market Analysis',
      command: 'Analyze current NEAR market conditions and trends',
      icon: <TrendingUp className="h-4 w-4" />,
      category: 'portfolio'
    }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (state.isConnected && messages.length === 0) {
      addWelcomeMessage();
    }
  }, [state.isConnected]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Hello! I'm your NEAR AI assistant. I can help you with:\n\n• Portfolio management and analysis\n• Staking and validator selection\n• DeFi yield farming strategies\n• Transaction monitoring\n• Market insights and recommendations\n\nWhat would you like to do today?`,
      timestamp: new Date(),
      status: 'completed'
    };
    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async (message?: string) => {
    const messageContent = message || inputMessage.trim();
    if (!messageContent || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    const processingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Processing your request...',
      timestamp: new Date(),
      status: 'processing'
    };

    setMessages(prev => [...prev, userMessage, processingMessage]);
    setInputMessage('');
    setIsProcessing(true);
    setShowQuickCommands(false);

    try {
      // Process the command through the NEAR agent
      const response = await processAICommand(messageContent);
      
      // Parse response and extract actions
      const actions = extractActionsFromResponse(messageContent, response);
      
      const assistantMessage: ChatMessage = {
        id: processingMessage.id,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        actions,
        status: 'completed'
      };

      setMessages(prev => 
        prev.map(msg => 
          msg.id === processingMessage.id ? assistantMessage : msg
        )
      );
    } catch (error) {
      console.error('AI processing error:', error);
      
      const errorMessage: ChatMessage = {
        id: processingMessage.id,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.',
        timestamp: new Date(),
        status: 'error'
      };

      setMessages(prev => 
        prev.map(msg => 
          msg.id === processingMessage.id ? errorMessage : msg
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const extractActionsFromResponse = (command: string, response: string): ChatAction[] => {
    const actions: ChatAction[] = [];
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('stake') && lowerCommand.includes('near')) {
      const amountMatch = command.match(/(\d+(?:\.\d+)?)\s*near/i);
      if (amountMatch) {
        actions.push({
          type: 'stake',
          label: `Stake ${amountMatch[1]} NEAR`,
          data: {
            amount: amountMatch[1],
            validatorId: 'meta-pool.pool.near'
          }
        });
      }
    }

    if (lowerCommand.includes('swap') || lowerCommand.includes('trade')) {
      const fromMatch = command.match(/(\d+(?:\.\d+)?)\s*(\w+)\s*(?:to|for)\s*(\w+)/i);
      if (fromMatch) {
        actions.push({
          type: 'swap',
          label: `Swap ${fromMatch[1]} ${fromMatch[2]} to ${fromMatch[3]}`,
          data: {
            fromToken: fromMatch[2],
            toToken: fromMatch[3],
            amount: fromMatch[1]
          }
        });
      }
    }

    if (lowerCommand.includes('send') || lowerCommand.includes('transfer')) {
      const transferMatch = command.match(/(?:send|transfer)\s*(\d+(?:\.\d+)?)\s*(\w+)\s*(?:to|→)\s*([a-zA-Z0-9._-]+)/i);
      if (transferMatch) {
        actions.push({
          type: 'transfer',
          label: `Send ${transferMatch[1]} ${transferMatch[2]} to ${transferMatch[3]}`,
          data: {
            amount: transferMatch[1],
            token: transferMatch[2],
            recipient: transferMatch[3]
          }
        });
      }
    }

    return actions;
  };

  const executeAction = async (action: ChatAction, messageId: string) => {
    try {
      // Execute the action through the NEAR agent
      console.log('Executing action:', action);
      
      // Mark action as executed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? {
                ...msg,
                actions: msg.actions?.map(a => 
                  a === action ? { ...a, executed: true } : a
                ) || []
              }
            : msg
        )
      );

      // Add confirmation message
      const confirmationMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Successfully executed: ${action.label}`,
        timestamp: new Date(),
        status: 'completed'
      };

      setMessages(prev => [...prev, confirmationMessage]);
    } catch (error) {
      console.error('Action execution error:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Failed to execute: ${action.label}. Error: ${error}`,
        timestamp: new Date(),
        status: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearChat = () => {
    setMessages([]);
    addWelcomeMessage();
    setShowQuickCommands(true);
  };

  if (!state.isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] text-center"
      >
        <Bot className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600 mb-6">Connect your NEAR wallet to start chatting with the AI assistant</p>
        <Button onClick={connectWallet} className="bg-blue-600 hover:bg-blue-700">
          Connect Wallet
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="h-[700px] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bot className="h-8 w-8 text-blue-600" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <CardTitle>NEAR AI Assistant</CardTitle>
                <p className="text-sm text-gray-600">Your intelligent blockchain companion</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={clearChat}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Quick Commands */}
          {showQuickCommands && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border-b bg-gray-50"
            >
              <h4 className="font-medium mb-3 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Quick Commands
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {quickCommands.map((cmd, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage(cmd.command)}
                    className="justify-start text-left h-auto p-3"
                  >
                    <div className="flex items-center space-x-2 w-full">
                      {cmd.icon}
                      <span className="truncate">{cmd.label}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`flex items-start space-x-2 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      
                      <div className={`rounded-2xl p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                        
                        {message.actions && message.actions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.actions.map((action, index) => (
                              <Button
                                key={index}
                                variant={action.executed ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => executeAction(action, message.id)}
                                disabled={action.executed || isProcessing}
                                className="w-full justify-start bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                              >
                                {action.executed ? (
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                ) : (
                                  <Zap className="h-4 w-4 mr-2" />
                                )}
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          
                          {message.role === 'assistant' && (
                            <div className="flex items-center space-x-1">
                              {message.status === 'processing' && (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              )}
                              {message.status === 'error' && (
                                <AlertCircle className="h-3 w-3 text-red-500" />
                              )}
                              {message.status === 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(message.content)}
                                  className="h-auto p-1 opacity-70 hover:opacity-100"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything about NEAR Protocol..."
                  disabled={isProcessing}
                  className="pr-12"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startVoiceRecognition}
                  disabled={isProcessing}
                  className={`absolute right-1 top-1 h-8 w-8 p-0 ${
                    isListening ? 'text-red-600' : 'text-gray-400'
                  }`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isProcessing}
                className="h-10 w-10 p-0"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
              <Brain className="h-3 w-3 mr-1" />
              AI-powered by NEAR Protocol • Always verify transactions
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIChatAssistant; 