import { StoryClient, StoryConfig } from "@story-protocol/core-sdk";
import { IPLicenseTerms, IPMetadata } from '../../types/ip-agent';
import { http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import env from "../../../env";

export interface ATCPIPConfig {
  agentId: string;
}

export class ATCPIPProvider {
  private storyClient: StoryClient;
  private agentId: string;

  constructor(config: ATCPIPConfig) {
    this.agentId = config.agentId;

    // Initialize Story Protocol client
    const account = privateKeyToAccount(env.WALLET_PRIVATE_KEY as `0x${string}`);
    const storyConfig: StoryConfig = {
      transport: http(env.RPC_PROVIDER_URL),
      account,
    };

    this.storyClient = StoryClient.newClient(storyConfig);
  }

  private getStoryClient(): StoryClient {
    if (!this.storyClient) throw new Error("StoryClient not connected");
    return this.storyClient;
  }

  async mintLicense(terms: IPLicenseTerms, metadata: IPMetadata): Promise<string> {
    const client = this.getStoryClient();
    
    // Create IP asset
    const response = await client.ip.create({
      name: terms.name,
      description: terms.description,
      transferable: terms.transferability,
      royaltyRate: BigInt(Math.floor((terms.royalty_rate || 0) * 10000)), // Convert to basis points
      metadata: {
        scope: terms.scope,
        onchain_enforcement: terms.onchain_enforcement,
        terms_uri: metadata.link_to_terms,
        version: metadata.version,
        previous_license_id: metadata.previous_license_id,
      }
    });

    return response.id;
  }

  async verifyLicense(licenseId: string): Promise<boolean> {
    const client = this.getStoryClient();
    try {
      const license = await client.ip.get(licenseId);
      return !!license;
    } catch {
      return false;
    }
  }

  async getLicenseTerms(licenseId: string): Promise<IPLicenseTerms> {
    const client = this.getStoryClient();
    const license = await client.ip.get(licenseId);
    
    return {
      name: license.name,
      description: license.description,
      scope: license.metadata.scope || 'commercial',
      transferability: license.transferable,
      onchain_enforcement: license.metadata.onchain_enforcement || true,
      royalty_rate: Number(license.royaltyRate) / 10000, // Convert from basis points
    };
  }

  async getLicenseMetadata(licenseId: string): Promise<IPMetadata> {
    const client = this.getStoryClient();
    const license = await client.ip.get(licenseId);
    
    return {
      license_id: licenseId,
      issuer_id: license.owner,
      holder_id: license.owner,
      issue_date: Date.now(),
      version: license.metadata.version || '1.0',
      link_to_terms: license.metadata.terms_uri,
      previous_license_id: license.metadata.previous_license_id,
    };
  }

  async listLicenses(options?: {
    issuerId?: string;
    holderId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Array<{ licenseId: string; terms: IPLicenseTerms; metadata: IPMetadata }>> {
    const client = this.getStoryClient();
    const owner = options?.issuerId || options?.holderId;
    
    // Get licenses
    const licenses = await client.ip.list({
      owner,
      limit: options?.limit || 10,
      offset: options?.offset || 0,
    });

    return licenses.map(license => ({
      licenseId: license.id,
      terms: {
        name: license.name,
        description: license.description,
        scope: license.metadata.scope || 'commercial',
        transferability: license.transferable,
        onchain_enforcement: license.metadata.onchain_enforcement || true,
        royalty_rate: Number(license.royaltyRate) / 10000,
      },
      metadata: {
        license_id: license.id,
        issuer_id: license.owner,
        holder_id: license.owner,
        issue_date: Date.now(),
        version: license.metadata.version || '1.0',
        link_to_terms: license.metadata.terms_uri,
        previous_license_id: license.metadata.previous_license_id,
      }
    }));
  }
}