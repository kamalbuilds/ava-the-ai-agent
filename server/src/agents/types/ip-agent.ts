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
  }

  // ATCP/IP Protocol Methods
  protected async requestIP(
    providerId: string,
    request: { type: string; description: string }
  ): Promise<{ terms: IPLicenseTerms; metadata: IPMetadata }> {
    return this.atcpipProvider.requestIP(providerId, request);
  }

  protected async proposeTerms(
    requesterId: string,
    terms: IPLicenseTerms
  ): Promise<boolean> {
    return this.atcpipProvider.proposeTerms(requesterId, terms);
  }

  protected async negotiateTerms(
    counterpartyId: string,
    terms: IPLicenseTerms
  ): Promise<IPLicenseTerms> {
    return this.atcpipProvider.negotiateTerms(counterpartyId, terms);
  }

  protected async mintLicense(
    terms: IPLicenseTerms,
    metadata: IPMetadata
  ): Promise<string> {
    return this.atcpipProvider.mintLicense(terms, metadata);
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
    await this.recallStorage.store(key, data, metadata);
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
    await this.recallStorage.storeCoT(key, thoughts, metadata);
  }

  protected async retrieveChainOfThought(
    key: string
  ): Promise<{ thoughts: string[]; metadata?: Record<string, any> }> {
    return this.recallStorage.retrieveCoT(key);
  }
} 