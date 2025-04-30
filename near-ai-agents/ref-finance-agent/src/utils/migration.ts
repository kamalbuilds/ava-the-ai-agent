import { RefApiClient } from '../services/api-client';
import { createLogger } from './logger';
import { getNetworkConfig } from './config';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const logger = createLogger('Migration');
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);

/**
 * Utility for migrating data or settings between environments
 */
export class MigrationUtil {
  private apiClient: RefApiClient;
  private dataDir: string;

  constructor(networkId: string = 'mainnet', dataDir: string = './data') {
    const config = getNetworkConfig(networkId);
    this.apiClient = new RefApiClient(config);
    this.dataDir = dataDir;
    logger.info(`Migration utility initialized for network: ${networkId}`);
  }

  /**
   * Initialize the migration utility
   */
  public async initialize(): Promise<void> {
    try {
      // Ensure data directory exists
      if (!(await exists(this.dataDir))) {
        await mkdir(this.dataDir, { recursive: true });
        logger.info(`Created data directory: ${this.dataDir}`);
      }
      
      // Initialize API client
      await this.apiClient.initialize();
      logger.success('Migration utility initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize migration utility: ${error}`);
      throw error;
    }
  }

  /**
   * Export pools to a JSON file
   */
  public async exportPools(outputFile: string = 'pools.json'): Promise<void> {
    try {
      logger.info('Exporting pools data...');
      
      // Get pools data
      const poolsResponse = await this.apiClient.getPools();
      
      if (!poolsResponse.success || !poolsResponse.pools) {
        throw new Error(`Failed to get pools: ${poolsResponse.error}`);
      }
      
      const outputPath = path.join(this.dataDir, outputFile);
      
      // Export data to file
      await writeFile(
        outputPath,
        JSON.stringify(poolsResponse.pools, null, 2),
        'utf8'
      );
      
      logger.success(`Exported ${poolsResponse.pools.length} pools to ${outputPath}`);
    } catch (error) {
      logger.error(`Failed to export pools: ${error}`);
      throw error;
    }
  }

  /**
   * Export token metadata to a JSON file
   */
  public async exportTokenMetadata(
    tokenIds: string[],
    outputFile: string = 'tokens.json'
  ): Promise<void> {
    try {
      logger.info(`Exporting metadata for ${tokenIds.length} tokens...`);
      
      // Get token metadata
      const tokenMetadataPromises = tokenIds.map(tokenId => 
        this.apiClient.getTokenMetadata(tokenId)
          .catch(error => {
            logger.error(`Error fetching metadata for ${tokenId}: ${error}`);
            return null;
          })
      );
      
      const tokenMetadatas = await Promise.all(tokenMetadataPromises);
      const validTokenMetadatas = tokenMetadatas.filter(Boolean);
      
      const outputPath = path.join(this.dataDir, outputFile);
      
      // Export data to file
      await writeFile(
        outputPath,
        JSON.stringify(validTokenMetadatas, null, 2),
        'utf8'
      );
      
      logger.success(`Exported metadata for ${validTokenMetadatas.length} tokens to ${outputPath}`);
    } catch (error) {
      logger.error(`Failed to export token metadata: ${error}`);
      throw error;
    }
  }

  /**
   * Import pools from a JSON file
   */
  public async importPools(inputFile: string = 'pools.json'): Promise<any[]> {
    try {
      logger.info(`Importing pools from ${inputFile}...`);
      
      const inputPath = path.join(this.dataDir, inputFile);
      
      // Check if file exists
      if (!(await exists(inputPath))) {
        throw new Error(`File not found: ${inputPath}`);
      }
      
      // Read and parse file
      const data = await readFile(inputPath, 'utf8');
      const pools = JSON.parse(data);
      
      logger.success(`Imported ${pools.length} pools from ${inputPath}`);
      return pools;
    } catch (error) {
      logger.error(`Failed to import pools: ${error}`);
      throw error;
    }
  }

  /**
   * Import token metadata from a JSON file
   */
  public async importTokenMetadata(inputFile: string = 'tokens.json'): Promise<any[]> {
    try {
      logger.info(`Importing token metadata from ${inputFile}...`);
      
      const inputPath = path.join(this.dataDir, inputFile);
      
      // Check if file exists
      if (!(await exists(inputPath))) {
        throw new Error(`File not found: ${inputPath}`);
      }
      
      // Read and parse file
      const data = await readFile(inputPath, 'utf8');
      const tokens = JSON.parse(data);
      
      logger.success(`Imported metadata for ${tokens.length} tokens from ${inputPath}`);
      return tokens;
    } catch (error) {
      logger.error(`Failed to import token metadata: ${error}`);
      throw error;
    }
  }
} 