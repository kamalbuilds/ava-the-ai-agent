import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { A2AMessage } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('A2AClient');

/**
 * Sample A2A client to interact with RefFinanceAgent
 */
class A2AClient {
  private endpoint: string;
  private clientId: string;
  private targetAgentId: string;

  constructor(
    endpoint: string = 'http://localhost:3000/a2a',
    clientId: string = `client-${uuidv4()}`,
    targetAgentId: string = 'ref-finance-agent'
  ) {
    this.endpoint = endpoint;
    this.clientId = clientId;
    this.targetAgentId = targetAgentId;
    logger.info(`A2A client initialized with ID: ${this.clientId}`);
  }

  /**
   * Send a message to the agent
   */
  public async sendMessage(command: string, payload: any = {}): Promise<any> {
    try {
      logger.info(`Sending command: ${command}`);

      // Create A2A message
      const message: A2AMessage = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        sender: this.clientId,
        receiver: this.targetAgentId,
        type: 'request',
        content: {
          command,
          payload
        }
      };

      // Send request
      const response = await axios.post(this.endpoint, message);
      
      logger.success(`Received response for ${command}`);
      return response.data;
    } catch (error) {
      logger.error(`Error sending message: ${error}`);
      throw error;
    }
  }
}

/**
 * Run a demonstration of A2A client interactions
 */
async function runDemo(): Promise<void> {
  try {
    const client = new A2AClient();
    
    // Step 1: Get agent capabilities
    logger.info('Getting agent capabilities...');
    const capabilitiesResponse = await client.sendMessage('get-capabilities');
    console.log('Agent capabilities:', JSON.stringify(capabilitiesResponse.content, null, 2));
    
    // Step 2: Get popular token balances for a demo account
    logger.info('Getting token balances...');
    const balancesResponse = await client.sendMessage('get-token-balances', {
      account_id: 'demo.near', // Replace with a real account ID
      token_ids: ['wrap.near', 'usdt.tether-token.near']
    });
    console.log('Token balances:', JSON.stringify(balancesResponse.content, null, 2));
    
    // Step 3: Get token price
    logger.info('Getting token price...');
    const priceResponse = await client.sendMessage('get-token-price', {
      token_id: 'wrap.near',
      quote_id: 'usdt.tether-token.near'
    });
    console.log('Token price:', JSON.stringify(priceResponse.content, null, 2));
    
    // Step 4: Get pools
    logger.info('Getting pools...');
    const poolsResponse = await client.sendMessage('get-pools', {
      forceRefresh: true
    });
    console.log(`Retrieved ${poolsResponse.content.pools?.length || 0} pools`);
    
    logger.success('Demo completed successfully');
  } catch (error) {
    logger.error(`Demo failed: ${error}`);
  }
}

// Run the demo if this script is executed directly
if (require.main === module) {
  runDemo();
}

export { A2AClient }; 