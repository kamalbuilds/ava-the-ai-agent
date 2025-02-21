import { IPLicenseTerms, IPMetadata } from '../../types/ip-agent';

export class StoryProtocolClient {
  private endpoint: string;
  private apiKey: string;

  constructor(endpoint: string, apiKey: string) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  private async makeRequest(path: string, options: RequestInit = {}) {
    const response = await fetch(`${this.endpoint}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Story Protocol API error: ${response.statusText}`);
    }

    return response.json();
  }

  async requestIP(
    providerId: string,
    request: {
      requesterId: string;
      type: string;
      description: string;
    }
  ): Promise<{ terms: IPLicenseTerms; metadata: IPMetadata }> {
    return this.makeRequest('/ip/request', {
      method: 'POST',
      body: JSON.stringify({
        providerId,
        ...request,
      }),
    });
  }

  async proposeTerms(
    requesterId: string,
    proposal: {
      providerId: string;
      terms: IPLicenseTerms;
    }
  ): Promise<boolean> {
    const response = await this.makeRequest('/ip/propose-terms', {
      method: 'POST',
      body: JSON.stringify({
        requesterId,
        ...proposal,
      }),
    });
    return response.accepted;
  }

  async negotiateTerms(
    counterpartyId: string,
    negotiation: {
      agentId: string;
      terms: IPLicenseTerms;
    }
  ): Promise<IPLicenseTerms> {
    return this.makeRequest('/ip/negotiate', {
      method: 'POST',
      body: JSON.stringify({
        counterpartyId,
        ...negotiation,
      }),
    });
  }

  async mintLicense(params: {
    terms: IPLicenseTerms;
    metadata: IPMetadata;
  }): Promise<string> {
    const response = await this.makeRequest('/ip/mint', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.licenseId;
  }

  async verifyLicense(licenseId: string): Promise<boolean> {
    const response = await this.makeRequest(`/ip/verify/${encodeURIComponent(licenseId)}`);
    return response.valid;
  }

  async getLicenseTerms(licenseId: string): Promise<IPLicenseTerms> {
    return this.makeRequest(`/ip/terms/${encodeURIComponent(licenseId)}`);
  }

  async getLicenseMetadata(licenseId: string): Promise<IPMetadata> {
    return this.makeRequest(`/ip/metadata/${encodeURIComponent(licenseId)}`);
  }

  async listLicenses(
    options?: {
      issuerId?: string;
      holderId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Array<{ licenseId: string; terms: IPLicenseTerms; metadata: IPMetadata }>> {
    return this.makeRequest('/ip/licenses', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }
} 