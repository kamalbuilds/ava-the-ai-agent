declare module 'nexus-js' {
  export class NexusClient {
    constructor(rpcUrl: string, appId: string);
    getAccount(): Promise<any>;
  }

  export class MailBoxClient {
    constructor(mailboxAddress: string, rpcUrl: string, privateKey: string);
    getContract(): any;
    getAddress(): string;
  }

  export class ProofManagerClient {
    constructor(proofManagerAddress: string, rpcUrl: string, privateKey: string);
    updateNexusBlock(
      blockNumber: number,
      stateRoot: string,
      availHeaderHash: string,
      proof: string
    ): Promise<any>;
    updateChainState(
      blockNumber: number,
      proof: any,
      appId: string,
      account: any
    ): Promise<any>;
  }

  export class ZKSyncVerifier {
    constructor(
      config: {
        [appId: string]: {
          rpcUrl: string;
          mailboxContract: string;
          stateManagerContract: string;
          appID: string;
          chainId: string;
          type: string;
          privateKey: string;
        };
      },
      sourceAppId: string
    );
    
    getSourceAppId(): string;
    getDestinationAppId(): string;
    getConfig(): any;
    getReceiveMessageProof(
      height: number,
      messageDetails: any,
      options: { storageKey: string }
    ): Promise<any>;
    encodeMessageProof(proof: any): any;
  }

  export interface MailboxMessageStruct {
    nexusAppIDFrom: string;
    nexusAppIDTo: string[];
    data: string;
    from: string;
    to: string[];
    nonce: number;
  }

  export function getStorageLocationForReceipt(receiptHash: string): string;
} 