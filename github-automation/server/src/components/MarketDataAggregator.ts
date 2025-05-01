import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { ErrorHandler } from '../middleware/errorHandler';

interface MarketDataAggregatorConfig {
  enabled: boolean;
  maxConnections: number;
  timeoutMs: number;
  retryAttempts: number;
}

interface MarketDataAggregatorMetrics {
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  uptime: number;
}

export class MarketDataAggregator {
  private config: MarketDataAggregatorConfig;
  private metrics: MarketDataAggregatorMetrics;
  private logger: Logger;
  private isInitialized = false;

  constructor(config: Partial<MarketDataAggregatorConfig> = {}) {
    this.config = {
      enabled: true,
      maxConnections: 1000,
      timeoutMs: 30000,
      retryAttempts: 3,
      ...config
    };
    
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      avgResponseTime: 0,
      uptime: 0
    };
    
    this.logger = new Logger('MarketDataAggregator');
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing MarketDataAggregator...');
      
      if (!this.config.enabled) {
        this.logger.warn('MarketDataAggregator is disabled in configuration');
        return;
      }

      // Initialize component-specific logic
      await this.setupConnections();
      await this.validateConfiguration();
      
      this.isInitialized = true;
      this.logger.info('MarketDataAggregator initialized successfully');
      
      // Start metrics collection
      this.startMetricsCollection();
      
    } catch (error) {
      this.logger.error('Failed to initialize MarketDataAggregator:', error);
      throw error;
    }
  }

  private async setupConnections(): Promise<void> {
    // Component-specific connection setup
    this.logger.debug('Setting up connections for MarketDataAggregator');
  }

  private async validateConfiguration(): Promise<void> {
    if (this.config.maxConnections <= 0) {
      throw new Error('Invalid maxConnections configuration');
    }
    
    if (this.config.timeoutMs <= 0) {
      throw new Error('Invalid timeoutMs configuration');
    }
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 60000); // Update every minute
  }

  private updateMetrics(): void {
    this.metrics.uptime = process.uptime();
    this.logger.debug('Metrics updated', this.metrics);
  }

  async processRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!this.isInitialized) {
      return next(new Error('MarketDataAggregator not initialized'));
    }

    const startTime = Date.now();
    
    try {
      this.metrics.requestCount++;
      
      // Process the request
      await this.handleRequest(req, res);
      
      const responseTime = Date.now() - startTime;
      this.updateResponseTime(responseTime);
      
    } catch (error) {
      this.metrics.errorCount++;
      this.logger.error('Request processing failed:', error);
      next(error);
    }
  }

  private async handleRequest(req: Request, res: Response): Promise<void> {
    // Component-specific request handling logic
    res.json({
      success: true,
      component: 'MarketDataAggregator',
      timestamp: new Date().toISOString(),
      feature: '📈 Real-time Market Data Aggregator'
    });
  }

  private updateResponseTime(responseTime: number): void {
    const count = this.metrics.requestCount;
    this.metrics.avgResponseTime = 
      ((this.metrics.avgResponseTime * (count - 1)) + responseTime) / count;
  }

  getMetrics(): MarketDataAggregatorMetrics {
    return { ...this.metrics };
  }

  getHealth(): { status: string; metrics: MarketDataAggregatorMetrics } {
    return {
      status: this.isInitialized ? 'healthy' : 'initializing',
      metrics: this.getMetrics()
    };
  }

  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down MarketDataAggregator...');
      // Cleanup logic
      this.isInitialized = false;
      this.logger.info('MarketDataAggregator shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      throw error;
    }
  }
}

export default MarketDataAggregator;