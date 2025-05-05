import { Hono } from 'hono';
import { zoraCoinsService } from '../services/zoraCoins';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Address } from 'viem';

// Zora coins controller handles all Zora Coins related API endpoints
export const zoraCoinsRouter = new Hono();

// Schema for creating a coin
const createCoinSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  uri: z.string(),
  payoutRecipient: z.string(),
  platformReferrer: z.string().optional(),
  owners: z.array(z.string()).optional(),
  initialPurchaseWei: z.string().optional(), // Will be converted to bigint
  account: z.string(),
});

// Schema for trading a coin
const tradeCoinSchema = z.object({
  coinContract: z.string(),
  amountIn: z.string(), // Will be converted to bigint
  slippageBps: z.number().optional(),
  platformReferrer: z.string().optional(),
  traderReferrer: z.string().optional(),
  account: z.string(),
});

// Schema for updating a coin URI
const updateCoinURISchema = z.object({
  coinContract: z.string(),
  uri: z.string(),
  account: z.string(),
});

// Create a new coin
zoraCoinsRouter.post('/create', zValidator('json', createCoinSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    
    const result = await zoraCoinsService.createCoin({
      ...data,
      payoutRecipient: data.payoutRecipient as Address,
      platformReferrer: data.platformReferrer as Address | undefined,
      owners: data.owners as Address[] | undefined,
      initialPurchaseWei: data.initialPurchaseWei ? BigInt(data.initialPurchaseWei) : undefined,
      account: data.account as Address,
    });
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating coin:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Trade a coin
zoraCoinsRouter.post('/trade', zValidator('json', tradeCoinSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    
    const result = await zoraCoinsService.tradeCoin({
      coinContract: data.coinContract as Address,
      amountIn: BigInt(data.amountIn),
      slippageBps: data.slippageBps,
      platformReferrer: data.platformReferrer as Address | undefined,
      traderReferrer: data.traderReferrer as Address | undefined,
      account: data.account as Address,
    });
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Error trading coin:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update a coin's URI
zoraCoinsRouter.post('/update-uri', zValidator('json', updateCoinURISchema), async (c) => {
  try {
    const data = c.req.valid('json');
    
    const result = await zoraCoinsService.updateCoinURI({
      coinContract: data.coinContract as Address,
      uri: data.uri,
      account: data.account as Address,
    });
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating coin URI:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get details for a specific coin
zoraCoinsRouter.get('/coin/:address', async (c) => {
  try {
    const address = c.req.param('address');
    const result = await zoraCoinsService.getCoinDetails(address as Address);
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting coin details:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get multiple coins
zoraCoinsRouter.get('/coins', async (c) => {
  try {
    const { limit, cursor, addresses } = c.req.query();
    
    const result = await zoraCoinsService.getMultipleCoins({
      limit: limit ? parseInt(limit) : undefined,
      cursor: cursor,
      addresses: addresses ? addresses.split(',') as Address[] : undefined,
    });
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting multiple coins:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get profile info
zoraCoinsRouter.get('/profile/:address', async (c) => {
  try {
    const address = c.req.param('address');
    const result = await zoraCoinsService.getProfileInfo(address as Address);
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting profile info:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get profile balances
zoraCoinsRouter.get('/profile-balances/:address', async (c) => {
  try {
    const address = c.req.param('address');
    const result = await zoraCoinsService.getProfileBalances(address as Address);
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting profile balances:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get trending coins
zoraCoinsRouter.get('/trending/:timeframe', async (c) => {
  try {
    const timeframe = c.req.param('timeframe') as 'day' | 'week' | 'month';
    const { limit, cursor } = c.req.query();
    
    if (!['day', 'week', 'month'].includes(timeframe)) {
      return c.json({ success: false, error: 'Invalid timeframe. Must be day, week, or month.' }, 400);
    }
    
    const result = await zoraCoinsService.getTrendingCoins({
      timeframe,
      limit: limit ? parseInt(limit) : undefined,
      cursor: cursor,
    });
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting trending coins:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get on-chain details for a coin
zoraCoinsRouter.get('/onchain/:address', async (c) => {
  try {
    const address = c.req.param('address');
    const result = await zoraCoinsService.getOnchainDetails(address as Address);
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting onchain coin details:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
}); 