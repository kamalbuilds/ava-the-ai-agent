"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, Brain, Zap, Settings, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIPortfolioOptimizerProps {
  onAction?: (action: string, data?: any) => void;
  className?: string;
}

interface MetricsData {
  performance: number;
  efficiency: number;
  accuracy: number;
  uptime: number;
}

export function AIPortfolioOptimizer({ onAction, className = "" }: AIPortfolioOptimizerProps) {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [metrics, setMetrics] = useState<MetricsData>({
    performance: 95.7,
    efficiency: 87.3,
    accuracy: 92.1,
    uptime: 99.8
  });
  
  const { toast } = useToast();

  const updateMetrics = useCallback(() => {
    setMetrics(prev => ({
      performance: Math.max(85, Math.min(100, prev.performance + (Math.random() - 0.5) * 2)),
      efficiency: Math.max(80, Math.min(100, prev.efficiency + (Math.random() - 0.5) * 1.5)),
      accuracy: Math.max(85, Math.min(100, prev.accuracy + (Math.random() - 0.5) * 1)),
      uptime: Math.max(95, Math.min(100, prev.uptime + (Math.random() - 0.5) * 0.5))
    }));
  }, []);

  useEffect(() => {
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, [updateMetrics]);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsActive(!isActive);
      onAction?.(isActive ? 'deactivate' : 'activate', { component: 'AIPortfolioOptimizer' });
      
      toast({
        title: isActive ? "Deactivated" : "Activated",
        description: `🚀 Advanced AI Portfolio Optimizer has been ${isActive ? 'deactivated' : 'activated'} successfully`,
        variant: isActive ? "destructive" : "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-400" />
            🚀 Advanced AI Portfolio Optimizer
          </h1>
          <p className="text-gray-400 text-lg">
            Advanced AI-powered portfolio management with NEAR Protocol integration
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={isActive ? "default" : "secondary"} className="px-3 py-1">
            {isActive ? "🟢 Active" : "🔴 Inactive"}
          </Badge>
          <Button
            onClick={handleToggle}
            disabled={isLoading}
            className={isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            {isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="logs">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(metrics).map(([key, value]) => (
              <Card key={key} className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400 capitalize">
                    {key}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {value.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    +2.1% from last hour
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {isActive && (
            <Alert className="bg-blue-900/20 border-blue-700">
              <BarChart3 className="h-4 w-4" />
              <AlertDescription className="text-blue-300">
                🚀 AIPortfolioOptimizer is actively optimizing your portfolio with AI-powered strategies
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="metrics" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Performance Analytics</CardTitle>
              <CardDescription>Real-time system performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-400">
                Detailed metrics and analytics will be displayed here...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-400">
                Component configuration options will be available here...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-400">
                Recent activity and system logs will be shown here...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}