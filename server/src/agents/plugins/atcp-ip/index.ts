import { StoryProtocolClient } from './client';
import { IPLicenseTerms, IPMetadata } from '../../types/ip-agent';

export interface ATCPIPConfig {
  endpoint: string;
  apiKey: string;
  agentId: string;
}

export class ATCPIPProvider {
  private client: StoryProtocolClient;
  private agentId: string;

  constructor(config: ATCPIPConfig) {
    this.client = new StoryProtocolClient(config.endpoint, config.apiKey);
    this.agentId = config.agentId;
  }

  async requestIP(
    providerId: string,
    request: { type: string; description: string }
  ): Promise<{ terms: IPLicenseTerms; metadata: IPMetadata }> {
    return this.client.requestIP(providerId, {
      requesterId: this.agentId,
      ...request,
    });
  }

  async proposeTerms(
    requesterId: string,
    terms: IPLicenseTerms
  ): Promise<boolean> {
    return this.client.proposeTerms(requesterId, {
      providerId: this.agentId,
      terms,
    });
  }

  async negotiateTerms(
    counterpartyId: string,
    terms: IPLicenseTerms
  ): Promise<IPLicenseTerms> {
    return this.client.negotiateTerms(counterpartyId, {
      agentId: this.agentId,
      terms,
    });
  }

  async mintLicense(
    terms: IPLicenseTerms,
    metadata: IPMetadata
  ): Promise<string> {
    return this.client.mintLicense({
      terms,
      metadata: {
        ...metadata,
        issuer_id: this.agentId,
      },
    });
  }

  async verifyLicense(licenseId: string): Promise<boolean> {
    return this.client.verifyLicense(licenseId);
  }

  async getLicenseTerms(licenseId: string): Promise<IPLicenseTerms> {
    return this.client.getLicenseTerms(licenseId);
  }

  async getLicenseMetadata(licenseId: string): Promise<IPMetadata> {
    return this.client.getLicenseMetadata(licenseId);
  }

  async listLicenses(
    options?: {
      issuerId?: string;
      holderId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Array<{ licenseId: string; terms: IPLicenseTerms; metadata: IPMetadata }>> {
    return this.client.listLicenses(options);
  }
} 