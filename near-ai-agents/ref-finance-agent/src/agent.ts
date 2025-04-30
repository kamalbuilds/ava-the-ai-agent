import { TokenService } from './services/token-service';
import { PoolService } from './services/pool-service';
import { SwapService } from './services/swap-service';
import { RefApiClient } from './services/api-client';
import { getNetworkConfig, AGENT_CONFIG } from './utils/config';
import { createLogger } from './utils/logger';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  A2AMessage,
  PoolsResponse,
  TokenPriceResponse,
  TokenBalancesResponse,
  SwapResponse,
  NearConfig,
  SwapParams,
  TokenPriceParams
} from './types';

/**
 * A2A protocol-compliant Ref Finance Agent
 */
export class RefFinanceAgent extends EventEmitter {
  private apiClient: RefApiClient;
  private tokenService: TokenService;
  private poolService: PoolService;
  private swapService: SwapService;
  private logger = createLogger('RefAgent');
  private config: NearConfig;
  private id: string;
  private initialized: boolean = false;
  
  constructor(networkId: string = 'mainnet', agentId?: string) {
    super();
    this.id = agentId || `ref-finance-agent-${uuidv4()}`;
    this.config = getNetworkConfig(networkId);
    this.logger.info(`Agent initialized with network: ${this.config.networkId}`);
    this.apiClient = new RefApiClient(this.config);
    this.tokenService = new TokenService(this.apiClient);
    this.poolService = new PoolService(this.apiClient);
    this.swapService = new SwapService(this.apiClient, this.poolService, this.tokenService);
  }

  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      this.logger.info('Initializing agent...');
      await this.apiClient.initialize();
      this.initialized = true;
      this.logger.success('Agent initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize agent: ${error}`);
      throw error;
    }
  }

  /**
   * Handle a message from another agent
   * @param message The A2A message
   */
  public async handleA2AMessage(message: A2AMessage): Promise<A2AMessage> {
    try {
      // Ensure agent is initialized
      if (!this.initialized) {
        await this.initialize();
      }
      
      this.logger.info(`Received message of type ${message.type} from ${message.sender}`);
      
      // Prepare response message
      const response: A2AMessage = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        sender: this.id,
        receiver: message.sender,
        type: 'response',
        content: null
      };
      
      // Process message based on content
      if (message.type === 'request') {
        const { command, payload } = message.content;
        
        switch (command) {
          case 'get-pools':
            response.content = await this.handleGetPools(payload);
            break;
          case 'get-token-price':
            response.content = await this.handleGetTokenPrice(payload);
            break;
          case 'get-token-balances':
            response.content = await this.handleGetTokenBalances(payload);
            break;
          case 'swap-tokens':
            response.content = await this.handleSwapTokens(payload);
            break;
          case 'get-capabilities':
            response.content = this.handleGetCapabilities();
            break;
          default:
            this.logger.warn(`Unknown command: ${command}`);
            response.content = {
              success: false,
              error: `Unknown command: ${command}`
            };
        }
      } else {
        this.logger.warn(`Unsupported message type: ${message.type}`);
        response.content = {
          success: false,
          error: `Unsupported message type: ${message.type}`
        };
      }
      
      return response;
    } catch (error) {
      this.logger.error(`Error handling message: ${error}`);
      
      return {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        sender: this.id,
        receiver: message.sender,
        type: 'response',
        content: {
          success: false,
          error: `Error handling message: ${error}`
        }
      };
    }
  }

  /**
   * Handle get-pools command
   */
  private async handleGetPools(payload: any): Promise<PoolsResponse> {
    try {
      this.logger.info('Handling get-pools command');
      const { forceRefresh = false } = payload || {};
      return await this.poolService.getPools(forceRefresh);
    } catch (error) {
      this.logger.error(`Error handling get-pools: ${error}`);
      return {
        success: false,
        error: `Error fetching pools: ${error}`
      };
    }
  }

  /**
   * Handle get-token-price command
   */
  private async handleGetTokenPrice(payload: TokenPriceParams): Promise<TokenPriceResponse> {
    try {
      this.logger.info(`Handling get-token-price command for ${payload.token_id}`);
      return await this.tokenService.getTokenPrice(payload);
    } catch (error) {
      this.logger.error(`Error handling get-token-price: ${error}`);
      return {
        success: false,
        error: `Error fetching token price: ${error}`
      };
    }
  }

  /**
   * Handle get-token-balances command
   */
  private async handleGetTokenBalances(payload: any): Promise<TokenBalancesResponse> {
    try {
      const { account_id, token_ids } = payload;
      
      if (!account_id) {
        return {
          success: false,
          error: 'Missing account_id parameter'
        };
      }
      
      this.logger.info(`Handling get-token-balances command for ${account_id}`);
      return await this.tokenService.getTokenBalances(account_id, token_ids);
    } catch (error) {
      this.logger.error(`Error handling get-token-balances: ${error}`);
      return {
        success: false,
        error: `Error fetching token balances: ${error}`
      };
    }
  }

  /**
   * Handle swap-tokens command
   */
  private async handleSwapTokens(payload: SwapParams): Promise<SwapResponse> {
    try {
      this.logger.info(`Handling swap-tokens command for ${payload.account_id}`);
      
      // Validate required parameters
      if (!payload.account_id || !payload.token_in || !payload.token_out || !payload.amount_in) {
        return {
          success: false,
          error: 'Missing required parameters (account_id, token_in, token_out, amount_in)'
        };
      }
      
      return await this.swapService.swapTokens(payload);
    } catch (error) {
      this.logger.error(`Error handling swap-tokens: ${error}`);
      return {
        success: false,
        error: `Error swapping tokens: ${error}`
      };
    }
  }

  /**
   * Handle get-capabilities command
   */
  private handleGetCapabilities(): any {
    return {
      success: true,
      name: AGENT_CONFIG.name,
      displayName: AGENT_CONFIG.displayName,
      description: AGENT_CONFIG.description,
      capabilities: AGENT_CONFIG.capabilities
    };
  }

  /**
   * Get the agent's ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Get the agent's configuration
   */
  public getConfig(): NearConfig {
    return this.config;
  }
} 