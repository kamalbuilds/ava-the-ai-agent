import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createRefFinanceAgent } from '../index';
import { 
  handleA2AMessage, 
  handleDirectCommand, 
  getAgentCapabilities, 
  healthCheck 
} from './endpoints';
import { createLogger } from '../utils/logger';

const logger = createLogger('Server');

// Environment variables
const PORT = process.env.PORT || 3000;
const NETWORK_ID = process.env.NEAR_NETWORK_ID || 'mainnet';

// Create and initialize the agent
const agent = createRefFinanceAgent(NETWORK_ID);

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Log all requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/health', (req, res) => healthCheck(req, res, agent));
app.get('/capabilities', (req, res) => getAgentCapabilities(req, res, agent));
app.post('/a2a', (req, res) => handleA2AMessage(req, res, agent));
app.post('/command', (req, res) => handleDirectCommand(req, res, agent));

// Start the server
export async function startServer(): Promise<void> {
  try {
    // Initialize the agent
    await agent.initialize();
    logger.success(`Agent initialized on ${NETWORK_ID}`);

    // Start the server
    app.listen(PORT, () => {
      logger.success(`Server running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Capabilities: http://localhost:${PORT}/capabilities`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
}

// If this script is run directly
if (require.main === module) {
  startServer();
} 