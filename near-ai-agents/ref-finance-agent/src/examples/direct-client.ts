import axios from 'axios';
import { createLogger } from '../utils/logger';

const logger = createLogger('DirectClient');

/**
 * Sample direct client to interact with RefFinanceAgent API
 */
class DirectClient {
  private endpoint: string;

  constructor(endpoint: string = 'http://localhost:3000/command') {
    this.endpoint = endpoint;
    logger.info(`Direct client initialized with endpoint: ${this.endpoint}`);
  }

  /**
   * Send a command to the agent
   */
  public async sendCommand(command: string, payload: any = {}): Promise<any> {
    try {
      logger.info(`Sending command: ${command}`);

      // Send request
      const response = await axios.post(this.endpoint, {
        command,
        payload
      });
      
      logger.success(`Received response for ${command}`);
      return response.data;
    } catch (error) {
      logger.error(`Error sending command: ${error}`);
      throw error;
    }
  }
}

/**
 * Run a demonstration of direct client interactions
 */
async function runDemo(): Promise<void> {
  try {
    const client = new DirectClient();
    
    // Step 1: Get agent capabilities
    logger.info('Getting agent capabilities...');
    const capabilities = await client.sendCommand('get-capabilities');
    console.log('Agent capabilities:', JSON.stringify(capabilities, null, 2));
    
    // Step 2: Get token price
    logger.info('Getting token price...');
    const priceResponse = await client.sendCommand('get-token-price', {
      token_id: 'wrap.near',
      quote_id: 'usdt.tether-token.near'
    });
    console.log('Token price:', JSON.stringify(priceResponse, null, 2));
    
    // Step 3: Get pools (limited to 3 for demo)
    logger.info('Getting pools...');
    const poolsResponse = await client.sendCommand('get-pools');
    if (poolsResponse.success && poolsResponse.pools) {
      const poolCount = poolsResponse.pools.length;
      console.log(`Found ${poolCount} pools, showing first 3:`);
      
      for (let i = 0; i < Math.min(3, poolCount); i++) {
        const pool = poolsResponse.pools[i];
        console.log(`Pool #${pool.id}: ${pool.tokens.map((t: any) => t.symbol).join(' <-> ')}`);
      }
    } else {
      console.log('No pools found or error occurred');
    }
    
    logger.success('Demo completed successfully');
  } catch (error) {
    logger.error(`Demo failed: ${error}`);
  }
}

// Run the demo if this script is executed directly
if (require.main === module) {
  runDemo();
}

export { DirectClient }; 