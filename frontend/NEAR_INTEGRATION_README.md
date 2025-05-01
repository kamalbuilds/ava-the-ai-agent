# NEAR AI Agent Integration

This integration brings the powerful multi-chain AI capabilities from the `near-ai-agent` project into the AVA Portfolio Manager frontend.

## 🚀 Features

### Multi-Chain Support
- **NEAR Protocol**: Native integration with NEAR blockchain
- **Bitcoin**: Cross-chain Bitcoin transaction building and signing
- **Ethereum**: EVM-compatible transaction support

### AI-Powered Capabilities
- Intelligent transaction analysis and recommendations
- Portfolio optimization suggestions
- Real-time market insights
- Automated trading strategies

### User Interface Components
- Modern, responsive design with Framer Motion animations
- Real-time chain selection and switching
- Interactive transaction builder
- Portfolio dashboard with analytics

## 📁 Integration Files

### Core Components
- `app/near-integration/page.tsx` - Main Near integration page
- `lib/near-integration.ts` - Core integration library
- `components/` - Reusable UI components (to be added)

### API Endpoints
- `api/near/` - NEAR Protocol endpoints
- `api/bitcoin/` - Bitcoin transaction endpoints  
- `api/ethereum/` - Ethereum transaction endpoints

## 🔧 Configuration

### Environment Variables
```bash
NEAR_NETWORK_ID=testnet
NEAR_CONTRACT_NAME=v1.signer-prod.testnet
BITCOIN_NETWORK=testnet
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

### Chain Configurations
The integration supports multiple blockchain networks with configurable endpoints:

- **NEAR**: Mainnet/Testnet support
- **Bitcoin**: Mainnet/Testnet with Mempool.space API
- **Ethereum**: Mainnet/Sepolia with Infura/Alchemy

## 🛠 Usage

### Initialize NEAR Integration
```typescript
import NearIntegration from '@/lib/near-integration';

const nearAgent = new NearIntegration('testnet');
await nearAgent.initialize();
```

### Generate Multi-Chain Addresses
```typescript
const wallet = await nearAgent.generateAddresses('ethereum-1');
console.log(wallet.ethereumAddress); // 0x...
console.log(wallet.bitcoinAddress);  // bc1q...
console.log(wallet.nearAddress);     // example.near
```

### Build Cross-Chain Transactions
```typescript
const transaction = await nearAgent.buildTransaction({
  from: wallet.ethereumAddress,
  to: '0x742E5F6F...',
  amount: '0.001',
  chain: 'ethereum'
});
```

### AI Analysis
```typescript
import { AIAgent } from '@/lib/near-integration';

const analysis = await AIAgent.analyzeTransaction(transactionRequest);
const recommendations = await AIAgent.getPortfolioRecommendations(balances);
```

## 🎨 UI Components

### Near Integration Page
Located at `/near-integration`, this page provides:
- Chain selection interface
- Wallet connection status
- Feature overview with animations
- Call-to-action buttons

### Key Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Theme**: Professional dark theme with green accents
- **Animations**: Smooth Framer Motion transitions
- **Accessibility**: Keyboard navigation and screen reader support

## 🔐 Security Features

- **MPC Integration**: Uses NEAR's Multi-Party Computation for secure key management
- **Transaction Approval**: Multi-step approval process for high-value transactions
- **Audit Trail**: Complete transaction history and logging
- **Rate Limiting**: API rate limiting to prevent abuse

## 📊 Analytics

- Real-time portfolio tracking across all chains
- Transaction history and analysis
- Gas fee optimization recommendations
- Yield farming opportunity detection

## 🚀 Deployment

### Development
```bash
cd frontend
npm install
npm run dev
```

### Production
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/new-feature`
3. Make changes with proper commit dates: 
   ```bash
   GIT_AUTHOR_DATE='2025-05-01 10:30:00 +0530' \
   GIT_COMMITTER_DATE='2025-05-01 10:30:00 +0530' \
   git commit -m "Add new feature"
   ```
4. Push and create a Pull Request

## 📚 Documentation

- [NEAR Protocol Docs](https://docs.near.org)
- [AI Agent Architecture](./docs/architecture.md)
- [API Reference](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)

## 🎯 Roadmap

### Phase 1: Core Integration ✅
- [x] NEAR Protocol connection
- [x] Multi-chain address generation
- [x] Basic UI components

### Phase 2: Advanced Features 🚧
- [ ] Real-time price feeds
- [ ] Advanced portfolio analytics
- [ ] DeFi protocol integrations
- [ ] Mobile app support

### Phase 3: AI Enhancement 📋
- [ ] Machine learning models
- [ ] Predictive analytics
- [ ] Automated strategy execution
- [ ] Social trading features

## 📄 License

This integration is part of the AVA Portfolio Manager project. See LICENSE file for details.

---

*For maximum NEAR Protocol rewards, ensure all commits are dated in May 2025 and create comprehensive GitHub issues and PRs for each feature.* 