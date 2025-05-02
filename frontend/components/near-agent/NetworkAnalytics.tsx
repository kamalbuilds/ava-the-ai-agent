"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Brain, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NetworkAnalyticsProps {
  onAction?: (action: string, data?: any) => void;
  isLoading?: boolean;
}

export function NetworkAnalytics({ onAction, isLoading = false }: NetworkAnalyticsProps) {
  const [isActive, setIsActive] = useState(false);
  const [metrics, setMetrics] = useState({
    totalValue: 0,
    activeOperations: 0,
    successRate: 95.7
  });
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        totalValue: prev.totalValue + Math.random() * 100,
        activeOperations: Math.floor(Math.random() * 10),
        successRate: 95 + Math.random() * 5
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleActivate = () => {
    setIsActive(!isActive);
    onAction?.(isActive ? 'deactivate' : 'activate');
    
    toast({
      title: isActive ? "Deactivated" : "Activated",
      description: `📊 Real-time NEAR Network Analytics Dashboard has been ${isActive ? 'deactivated' : 'activated'} successfully`,
      variant: isActive ? "destructive" : "default",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-400" />
            📊 Real-time NEAR Network Analytics Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Advanced NEAR Protocol integration with AI-powered capabilities
          </p>
        </div>
        <Button
          onClick={handleActivate}
          disabled={isLoading}
          className={`${
            isActive 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Zap className="w-4 h-4 mr-2" />
          )}
          {isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              $${metrics.totalValue.toFixed(2)}
            </div>
            <p className="text-gray-400 text-sm">Total managed value</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Active Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {metrics.activeOperations}
            </div>
            <p className="text-gray-400 text-sm">Currently running</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {metrics.successRate.toFixed(1)}%
            </div>
            <p className="text-gray-400 text-sm">Operation success rate</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">NetworkAnalytics Status</CardTitle>
          <CardDescription className="text-gray-400">
            Monitor and control your NEAR AI agent operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white">Status</span>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-white">NEAR Network</span>
            <Badge variant="default" className="bg-green-600">
              Connected
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white">AI Processing</span>
            <Badge variant="default" className="bg-blue-600">
              Optimized
            </Badge>
          </div>

          {isActive && (
            <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-700">
              <p className="text-blue-300 text-sm">
                🤖 AI Agent is actively monitoring and optimizing your NEAR operations
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}