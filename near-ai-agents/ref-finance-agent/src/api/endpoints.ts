import { Request, Response } from 'express';
import { RefFinanceAgent } from '../agent';
import { A2AMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger';

const logger = createLogger('API');

/**
 * Handler for A2A messages
 */
export async function handleA2AMessage(
  req: Request, 
  res: Response, 
  agent: RefFinanceAgent
): Promise<void> {
  try {
    const message: A2AMessage = req.body;
    
    // Validate the message format
    if (!isValidA2AMessage(message)) {
      logger.error('Invalid A2A message format');
      res.status(400).json({
        success: false,
        error: 'Invalid A2A message format'
      });
      return;
    }
    
    logger.info(`Received A2A message: ${message.id} from ${message.sender}`);
    
    // Process the message
    const response = await agent.handleA2AMessage(message);
    
    // Send the response
    res.status(200).json(response);
  } catch (error) {
    logger.error(`Error handling A2A message: ${error}`);
    res.status(500).json({
      success: false,
      error: `Server error: ${error}`
    });
  }
}

/**
 * Handler for direct command execution (non-A2A protocol)
 */
export async function handleDirectCommand(
  req: Request, 
  res: Response, 
  agent: RefFinanceAgent
): Promise<void> {
  try {
    const { command, payload } = req.body;
    
    // Validate the command
    if (!command) {
      logger.error('Missing command in request');
      res.status(400).json({
        success: false,
        error: 'Missing command in request'
      });
      return;
    }
    
    logger.info(`Received direct command: ${command}`);
    
    // Convert to A2A message format
    const message: A2AMessage = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      sender: 'api-client',
      receiver: agent.getId(),
      type: 'request',
      content: {
        command,
        payload: payload || {}
      }
    };
    
    // Process the message
    const response = await agent.handleA2AMessage(message);
    
    // Send just the content part of the response
    res.status(200).json(response.content);
  } catch (error) {
    logger.error(`Error handling direct command: ${error}`);
    res.status(500).json({
      success: false,
      error: `Server error: ${error}`
    });
  }
}

/**
 * Get agent capabilities endpoint
 */
export async function getAgentCapabilities(
  req: Request, 
  res: Response, 
  agent: RefFinanceAgent
): Promise<void> {
  try {
    // Create a message to get capabilities
    const message: A2AMessage = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      sender: 'api-client',
      receiver: agent.getId(),
      type: 'request',
      content: {
        command: 'get-capabilities',
        payload: {}
      }
    };
    
    // Process the message
    const response = await agent.handleA2AMessage(message);
    
    // Send the capabilities
    res.status(200).json(response.content);
  } catch (error) {
    logger.error(`Error getting agent capabilities: ${error}`);
    res.status(500).json({
      success: false,
      error: `Server error: ${error}`
    });
  }
}

/**
 * Health check endpoint
 */
export function healthCheck(
  req: Request, 
  res: Response, 
  agent: RefFinanceAgent
): void {
  try {
    const isInitialized = agent ? true : false;
    
    res.status(200).json({
      status: 'ok',
      agent: agent.getId(),
      network: agent.getConfig().networkId,
      initialized: isInitialized,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in health check: ${error}`);
    res.status(500).json({
      status: 'error',
      error: `Server error: ${error}`
    });
  }
}

/**
 * Validate the format of an A2A message
 */
function isValidA2AMessage(message: any): boolean {
  return (
    message &&
    typeof message.id === 'string' &&
    typeof message.timestamp === 'string' &&
    typeof message.sender === 'string' &&
    typeof message.receiver === 'string' &&
    ['request', 'response', 'notification'].includes(message.type) &&
    message.content !== undefined
  );
} 