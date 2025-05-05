"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { aiAgent, AIAnalysisRequest } from '@/lib/ai-agent';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  data?: any;
  messageType?: 'text' | 'analysis' | 'recommendation' | 'insight';
}

interface AIChatProps {
  walletConnected?: boolean;
  currentChain?: string;
}

const AIChat: React.FC<AIChatProps> = ({ walletConnected = false, currentChain = 'near' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your AI assistant for multi-chain portfolio management. I can help you analyze transactions, optimize your portfolio, and provide market insights. How can I assist you today?",
      timestamp: new Date(),
      messageType: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const suggestedQueries = [
    "Analyze my portfolio allocation",
    "What's the best time to send ETH?",
    "Should I buy more NEAR tokens?",
    "Show me market trends",
    "Optimize my gas fees"
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      messageType: 'text'
    };

    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: 'Analyzing your request...',
      timestamp: new Date(),
      isLoading: true,
      messageType: 'text'
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const response = await processUserQuery(inputValue);
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { ...response, id: loadingMessage.id }
            : msg
        )
      );
    } catch (error) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id 
            ? {
                ...msg,
                content: "I apologize, but I encountered an error processing your request. Please try again.",
                isLoading: false
              }
            : msg
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const processUserQuery = async (query: string): Promise<ChatMessage> => {
    const lowerQuery = query.toLowerCase();

    // Transaction analysis
    if (lowerQuery.includes('analyze') && (lowerQuery.includes('transaction') || lowerQuery.includes('send'))) {
      const analysisRequest: AIAnalysisRequest = {
        transactionType: 'send',
        chain: currentChain as any,
        amount: '100',
        asset: currentChain === 'near' ? 'NEAR' : currentChain === 'ethereum' ? 'ETH' : 'BTC'
      };

      const analysis = await aiAgent.analyzeTransaction(analysisRequest);
      
      return {
        id: '',
        type: 'ai',
        content: `I've analyzed your potential transaction. Here's what I found:`,
        timestamp: new Date(),
        messageType: 'analysis',
        data: analysis
      };
    }

    // Portfolio optimization
    if (lowerQuery.includes('portfolio') || lowerQuery.includes('optimize') || lowerQuery.includes('allocation')) {
      const mockBalances = { BTC: '1000', ETH: '2000', NEAR: '500' };
      const optimization = await aiAgent.optimizePortfolio(mockBalances, 'moderate');
      
      return {
        id: '',
        type: 'ai',
        content: `I've analyzed your portfolio and generated optimization recommendations:`,
        timestamp: new Date(),
        messageType: 'recommendation',
        data: optimization
      };
    }

    // Market insights
    if (lowerQuery.includes('market') || lowerQuery.includes('trend') || lowerQuery.includes('price')) {
      const insights = await aiAgent.getMarketInsights(['BTC', 'ETH', 'NEAR'], ['bitcoin', 'ethereum', 'near']);
      
      return {
        id: '',
        type: 'ai',
        content: `Here are the latest market insights:`,
        timestamp: new Date(),
        messageType: 'insight',
        data: insights
      };
    }

    // Gas optimization
    if (lowerQuery.includes('gas') || lowerQuery.includes('fee')) {
      return {
        id: '',
        type: 'ai',
        content: `For gas optimization on ${currentChain}, I recommend:\n\n• Use batch transactions when possible\n• Schedule transactions during off-peak hours (typically 2-6 AM UTC)\n• Consider Layer 2 solutions for Ethereum\n• Monitor gas prices using real-time trackers\n\nWould you like me to analyze a specific transaction for gas optimization?`,
        timestamp: new Date(),
        messageType: 'text'
      };
    }

    // General response
    return {
      id: '',
      type: 'ai',
      content: `I understand you're asking about "${query}". I can help you with:\n\n• Transaction analysis and optimization\n• Portfolio rebalancing recommendations\n• Market insights and trends\n• Gas fee optimization\n• Risk assessment\n\nCould you be more specific about what you'd like assistance with?`,
      timestamp: new Date(),
      messageType: 'text'
    };
  };

  const handleSuggestedQuery = (query: string) => {
    setInputValue(query);
    inputRef.current?.focus();
  };

  const renderMessageContent = (message: ChatMessage) => {
    if (message.isLoading) {
      return (
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{message.content}</span>
        </div>
      );
    }

    if (message.messageType === 'analysis' && message.data) {
      const analysis = message.data;
      return (
        <div className="space-y-3">
          <p>{message.content}</p>
          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center space-x-2 mb-3">
              {analysis.action === 'approve' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : analysis.action === 'reject' ? (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              )}
              <span className={`font-semibold ${
                analysis.action === 'approve' ? 'text-green-400' : 
                analysis.action === 'reject' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                Recommendation: {analysis.action.toUpperCase()}
              </span>
              <span className="text-sm text-gray-400">({analysis.confidence}% confidence)</span>
            </div>
            <p className="text-sm mb-2">{analysis.reasoning}</p>
            <div className="text-xs text-gray-400">
              Risk Level: <span className={`font-medium ${
                analysis.riskLevel === 'low' ? 'text-green-400' :
                analysis.riskLevel === 'medium' ? 'text-yellow-400' : 'text-red-400'
              }`}>{analysis.riskLevel.toUpperCase()}</span>
            </div>
          </div>
        </div>
      );
    }

    if (message.messageType === 'recommendation' && message.data) {
      const optimization = message.data;
      return (
        <div className="space-y-3">
          <p>{message.content}</p>
          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <h4 className="font-semibold mb-2">Rebalancing Actions:</h4>
            <div className="space-y-2">
              {optimization.rebalanceActions.slice(0, 3).map((action: any, index: number) => (
                <div key={index} className="text-sm flex justify-between">
                  <span>{action.action.toUpperCase()} {action.amount} {action.asset}</span>
                  <span className="text-gray-400">Priority: {action.priority}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-600 text-sm">
              <div className="flex justify-between">
                <span>Expected Return:</span>
                <span className="text-green-400">{optimization.expectedReturn}</span>
              </div>
              <div className="flex justify-between">
                <span>Risk Score:</span>
                <span>{optimization.riskScore}/10</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (message.messageType === 'insight' && message.data) {
      const insights = message.data;
      return (
        <div className="space-y-3">
          <p>{message.content}</p>
          <div className="space-y-2">
            {insights.slice(0, 3).map((insight: any, index: number) => (
              <div key={index} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{insight.asset}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    insight.trend === 'bullish' ? 'bg-green-400/20 text-green-400' :
                    insight.trend === 'bearish' ? 'bg-red-400/20 text-red-400' :
                    'bg-gray-400/20 text-gray-400'
                  }`}>
                    {insight.trend}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  Recommendation: <span className="font-medium">{insight.recommendation}</span>
                  {' '}({insight.confidence}% confidence)
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <p className="whitespace-pre-line">{message.content}</p>;
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 flex flex-col h-96">
      {/* Header */}
      <div className="flex items-center space-x-3 p-4 border-b border-gray-700">
        <Bot className="w-6 h-6 text-green-400" />
        <h3 className="text-lg font-semibold">AI Assistant</h3>
        {walletConnected && (
          <span className="px-2 py-1 bg-green-400/20 text-green-400 text-xs rounded-full">
            Connected to {currentChain}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-white'
              } rounded-lg p-3`}>
                <div className="flex items-start space-x-2">
                  {message.type === 'ai' && <Bot className="w-4 h-4 mt-1 text-green-400" />}
                  {message.type === 'user' && <User className="w-4 h-4 mt-1" />}
                  <div className="flex-1">
                    {renderMessageContent(message)}
                    <div className="text-xs opacity-60 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Queries */}
      {messages.length === 1 && (
        <div className="p-4 border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuery(query)}
                className="text-xs px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-full transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me about your portfolio, transactions, or market insights..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
            disabled={isProcessing}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AIChat; 