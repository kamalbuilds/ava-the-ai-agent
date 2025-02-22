import { StoryClient, StoryConfig, SupportedChainIds } from "@story-protocol/core-sdk";
import { IPLicenseTerms, IPMetadata } from '../../types/ip-agent';
import { http, Address, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import env from "../../../env";

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const WIP_TOKEN_ADDRESS = '0x1514000000000000000000000000000000000000' as const;
const DEFAULT_HASH = toHex('0', { size: 32 });

export interface ATCPIPConfig {
  agentId: string;
}

export class ATCPIPProvider {
  private storyClient: StoryClient;
  private agentId: string;

  constructor(config: ATCPIPConfig) {
    this.agentId = config.agentId;

    // Initialize Story Protocol client
    const privateKey = env.WALLET_PRIVATE_KEY as `0x${string}`;
    const transport = http(env.STORY_RPC_PROVIDER_URL || 'https://rpc.ankr.com/eth_sepolia') as any;
    
    const storyConfig: StoryConfig = {
      account: privateKey,
      transport,
      chainId: "aeneid" as SupportedChainIds,
    };

    this.storyClient = StoryClient.newClient(storyConfig);
  }

  private getStoryClient(): StoryClient {
    if (!this.storyClient) throw new Error("StoryClient not connected");
    return this.storyClient;
  }

  async mintLicense(terms: IPLicenseTerms, metadata: IPMetadata): Promise<string> {
    const client = this.getStoryClient();
    
    // Create IP asset with Story Protocol's mintAndRegisterIp
    const response = await client.ipAsset.register({
      nftContract: (process.env.SPG_NFT_CONTRACT_ADDRESS || ZERO_ADDRESS) as Address,
      tokenId: BigInt(Date.now()),
      ipMetadata: {
        ipMetadataURI: metadata.link_to_terms || '',
        ipMetadataHash: toHex(metadata.license_id || '0', { size: 32 }),
        nftMetadataURI: metadata.link_to_terms || '',
        nftMetadataHash: toHex(metadata.license_id || '0', { size: 32 }),
      },
      txOptions: { waitForTransaction: true }
    });

    return response.ipId || '';
  }

  async verifyLicense(licenseId: string): Promise<boolean> {
    const client = this.getStoryClient();
    try {
      const license = await client.ipAsset.register({
        nftContract: (process.env.NFT_CONTRACT_ADDRESS || ZERO_ADDRESS) as Address,
        tokenId: licenseId as Address,
        ipMetadata: {
          ipMetadataURI: '',
          ipMetadataHash: DEFAULT_HASH,
          nftMetadataURI: '',
          nftMetadataHash: DEFAULT_HASH,
        },
        txOptions: { waitForTransaction: true }
      });
      return !!license;
    } catch {
      return false;
    }
  }

  async getLicenseTerms(licenseId: string): Promise<IPLicenseTerms> {
    const client = this.getStoryClient();
    const license = await client.ipAsset.register({
      nftContract: (process.env.NFT_CONTRACT_ADDRESS || ZERO_ADDRESS) as Address,
      tokenId: licenseId as Address,
      ipMetadata: {
        ipMetadataURI: '',
        ipMetadataHash: DEFAULT_HASH,
        nftMetadataURI: '',
        nftMetadataHash: DEFAULT_HASH,
      },
      txOptions: { waitForTransaction: true }
    });
    
    return {
      name: license.ipId || '',
      description: '',
      scope: 'commercial',
      transferability: true,
      onchain_enforcement: true,
      royalty_rate: 0.05, // Default 5% royalty
    };
  }

  async getLicenseMetadata(licenseId: string): Promise<IPMetadata> {
    const client = this.getStoryClient();
    const license = await client.ipAsset.register({
      nftContract: (process.env.NFT_CONTRACT_ADDRESS || ZERO_ADDRESS) as Address,
      tokenId: licenseId as Address,
      ipMetadata: {
        ipMetadataURI: '',
        ipMetadataHash: DEFAULT_HASH,
        nftMetadataURI: '',
        nftMetadataHash: DEFAULT_HASH,
      },
      txOptions: { waitForTransaction: true }
    });
    
    return {
      license_id: licenseId,
      issuer_id: license.ipId || '',
      holder_id: license.ipId || '',
      issue_date: Date.now(),
      version: '1.0',
      link_to_terms: '',
      previous_license_id: '',
    };
  }

  async listLicenses(options?: {
    issuerId?: string;
    holderId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Array<{ licenseId: string; terms: IPLicenseTerms; metadata: IPMetadata }>> {
    const client = this.getStoryClient();
    const owner = options?.issuerId || options?.holderId || ZERO_ADDRESS;
    
    // Get licenses using Story Protocol's list method
    const licenses = await client.ipAsset.register({
      nftContract: (process.env.NFT_CONTRACT_ADDRESS || ZERO_ADDRESS) as Address,
      tokenId: owner as Address,
      ipMetadata: {
        ipMetadataURI: '',
        ipMetadataHash: DEFAULT_HASH,
        nftMetadataURI: '',
        nftMetadataHash: DEFAULT_HASH,
      },
      txOptions: { waitForTransaction: true }
    });

    return [{
      licenseId: licenses.ipId || '',
      terms: {
        name: '',
        description: '',
        scope: 'commercial',
        transferability: true,
        onchain_enforcement: true,
        royalty_rate: 0.05,
      },
      metadata: {
        license_id: licenses.ipId || '',
        issuer_id: licenses.ipId || '',
        holder_id: licenses.ipId || '',
        issue_date: Date.now(),
        version: '1.0',
        link_to_terms: '',
        previous_license_id: '',
      }
    }];
  }

  // New methods for agent-specific licensing

  async licenseTrainingData(
    trainingData: any,
    terms: IPLicenseTerms,
    metadata: IPMetadata
  ): Promise<string> {
    // First mint a license for the training data
    const licenseId = await this.mintLicense(terms, metadata);
    return licenseId;
  }

  async licenseAgentOutput(
    output: any,
    outputType: 'image' | 'text' | 'code',
    terms: IPLicenseTerms,
    metadata: IPMetadata
  ): Promise<string> {
    // Mint license for agent output
    const licenseId = await this.mintLicense(terms, metadata);
    return licenseId;
  }

  async exchangeIP(
    fromAgentId: string,
    toAgentId: string,
    licenseId: string,
    terms: IPLicenseTerms
  ): Promise<boolean> {
    const client = this.getStoryClient();

    try {
      // Transfer the IP license using registerDerivativeWithLicenseTokens
      await client.ipAsset.registerDerivativeWithLicenseTokens({
        childIpId: toAgentId as Address,
        licenseTokenIds: [BigInt(licenseId)],
        txOptions: { waitForTransaction: true },
      });

      return true;
    } catch (error) {
      console.error('Failed to exchange IP:', error);
      return false;
    }
  }

  async payRoyalties(
    licenseId: string,
    amount: number
  ): Promise<boolean> {
    const client = this.getStoryClient();

    try {
      // Pay royalties using Story Protocol's payment system
      await client.royalty.payRoyaltyOnBehalf({
        receiverIpId: licenseId as Address,
        payerIpId: ZERO_ADDRESS as Address,
        token: WIP_TOKEN_ADDRESS as Address,
        amount: BigInt(amount),
        txOptions: { waitForTransaction: true }
      });

      return true;
    } catch (error) {
      console.error('Failed to pay royalties:', error);
      return false;
    }
  }
}