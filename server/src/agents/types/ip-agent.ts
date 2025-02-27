import { Agent } from '../agent';
import { EventBus } from '../../comms';
import { AIProvider } from '../../services/ai/types';
import { RecallStorage } from '../plugins/recall-storage';
import { ATCPIPProvider } from '../plugins/atcp-ip';

export interface IPMetadata {
  license_id?: string;
  issuer_id: string;
  holder_id: string;
  issue_date: number;
  expiry_date?: number;
  version: string;
  link_to_terms?: string;
  previous_license_id?: string;
  signature?: string;
}

export interface IPLicenseTerms {
  name: string;
  description: string;
  scope: 'personal' | 'commercial' | 'sublicensable';
  duration?: number;
  jurisdiction?: string;
  governing_law?: string;
  royalty_rate?: number;
  transferability: boolean;
  revocation_conditions?: string[];
  dispute_resolution?: string;
  onchain_enforcement: boolean;
  offchain_enforcement?: string;
  compliance_requirements?: string[];
  ip_restrictions?: string[];
  chain_of_ownership?: string[];
  rev_share?: number;
}

export abstract class IPAgent extends Agent {
  protected recallStorage: RecallStorage;
  protected atcpipProvider: ATCPIPProvider;
  private bucketAlias: string;

  constructor(
    name: string, 
    eventBus: EventBus, 
    recallStorage: RecallStorage,
    atcpipProvider: ATCPIPProvider,
    aiProvider?: AIProvider
  ) {
    super(name, eventBus, aiProvider);
    this.recallStorage = recallStorage;
    this.atcpipProvider = atcpipProvider;
    this.bucketAlias = `${name}-bucket`;
    this.initializeRecallBucket();
  }

  private async initializeRecallBucket(): Promise<void> {
    try {
      await this.recallStorage.initializeBucket(this.bucketAlias);
    } catch (error) {
      console.error(`Error initializing Recall bucket for ${this.name}:`, error);
    }
  }

  protected async mintLicense(
    terms: IPLicenseTerms,
    metadata: IPMetadata
  ): Promise<string> {
    const licenseId = await this.atcpipProvider.mintLicense(terms, metadata);
    
    // Store license in Recall
    await this.storeIntelligence(`license:${licenseId}`, {
      terms,
      metadata: {
        ...metadata,
        license_id: licenseId,
      },
    });

    return licenseId;
  }

  protected async verifyLicense(licenseId: string): Promise<boolean> {
    return this.atcpipProvider.verifyLicense(licenseId);
  }

  // Recall Storage Methods
  protected async storeIntelligence(
    key: string,
    data: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.recallStorage.store(key, data, {
      ...metadata,
      agent: this.name,
      timestamp: Date.now(),
      type: 'intelligence',
      overwrite: true
    });
  }

  protected async retrieveIntelligence(
    key: string
  ): Promise<{ data: any; metadata?: Record<string, any> }> {
    return this.recallStorage.retrieve(key);
  }

  protected async storeChainOfThought(
    key: string,
    thoughts: string[],
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.recallStorage.storeCoT(key, thoughts, {
      ...metadata,
      agent: this.name,
      timestamp: Date.now(),
      type: 'chain-of-thought',
    });
  }

  protected async retrieveChainOfThought(
    key: string
  ): Promise<{ thoughts: string[]; metadata?: Record<string, any> }> {
    return this.recallStorage.retrieveCoT(key);
  }

  protected async searchIntelligence(
    query: string,
    options?: {
      limit?: number;
      filter?: Record<string, any>;
    }
  ): Promise<Array<{ key: string; score: number; data: any }>> {
    return this.recallStorage.search(query, {
      ...options,
      filter: {
        ...options?.filter,
        agent: this.name,
      },
    });
  }

  protected async retrieveRecentThoughts(
    limit: number = 10
  ): Promise<Array<{ thoughts: string[]; metadata?: Record<string, any> }>> {
    const results = await this.recallStorage.search('type:chain-of-thought', {
      limit,
      filter: {
        agent: this.name,
      },
    });

    return results.map(result => ({
      thoughts: result.data.thoughts,
      metadata: result.data.metadata,
    }));
  }
} 