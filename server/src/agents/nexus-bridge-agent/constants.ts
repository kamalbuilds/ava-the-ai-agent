
export const bridgeTokens = {
  "0x1": { 
    name: "Test Token",
    symbol: "TEST",
    decimals: 18,
    sourceChainAddress: "0x44c92F289Ce0be8c8dBB59d51bC2c6485ebF8DFB", 
    destChainAddress: "0xD464c2d2B354D97AFBCC8a04096212b1483Ff065",
  }
};


export const defaultConfig = {
  // ZKSync 1
  zksync1: {
    rpcUrl: "https://zksync1.nexus.avail.tools",
    bridgeAddress: "0x74040d76894401D697750509ac0Ac5Dd0BAf1a93",
    mailboxAddress: "0x9a03a545A60263216c4310Be05C34B71C170903A",
    proofManagerAddress: "0xaaA07C6575E855AA279Ba04B63E8C5ee7FBc5908",
    appId: "0x1f5ff885ceb5bf1350c4449316b7d703034c1278ab25bcc923d5347645a0117e",
    chainId: "270",
  },
  // ZKSync 2
  zksync2: {
    rpcUrl: "https://zksync2.nexus.avail.tools",
    bridgeAddress: "0xdED0afd11372a9c3c3aa40Ba6080879bB740DF49",
    mailboxAddress: "0x96A52A4dAcf9Cf7c07C6af08Ecf892ec009ea5aa",
    proofManagerAddress: "0x19CC70262bc3337Ebd21750125d725546e1E0982",
    appId: "0x31b8a7e9f916616a8ed5eb471a36e018195c319600cbd3bbe726d1c96f03568d",
    chainId: "271",
  },
  // Nexus RPC URL
  nexusRpcUrl: "http://dev.nexus.avail.tools",
};

// Default nonce for bridge transactions
export const DEFAULT_NONCE = 3; 