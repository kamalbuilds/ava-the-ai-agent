# Ref Finance DeFi Swap Agent

<img src="https://github.com/user-attachments/assets/aa54bac4-30ef-49bb-bac7-732ff561bd95" alt="cover_image" width="0"/>

Ref Finance Agent is a template for creating a Bitte.ai Plugin for facilitating DeFi swaps using Ref Finance. Built using Next.js 14 + Elysia.

[![Demo](https://img.shields.io/badge/Demo-Visit%20Demo-brightgreen)](https://ref-finance-agent-next.vercel.app/)
[![Deploy](https://img.shields.io/badge/Deploy-on%20Vercel-blue)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMintbase%2Fref-finance-agent-next)

**Tooling:**

[![Use Case](https://img.shields.io/badge/Use%20Case-AI-blue)](#)
[![Framework](https://img.shields.io/badge/Framework-Next.js%2014-blue)](#)

## Project Walkthrough

Ref Finance Agent facilitates the development of AI-powered DeFi swap agents. The template supports creating, managing, and deploying DeFi swap functionalities. [Build your own agent](https://docs.bitte.ai/agents)

#### API Base URL

https://ref-finance-agent.vercel.app

#### Endpoints

- Token Metadata `GET` `/api/token/{token}`

- Swap Transactions `GET` `/api/swap/{tokenIn}/{tokenOut}/{quantity}`

#### Usage

Make LLM requests to the endpoints above. Refer to the full API documentation for detailed parameter and response information.

## Getting Started

[Docs to integrate](https://docs.bitte.ai/agents/quick-start)

### Installation

Copy `.env.example` to `.env` and set the required environment variables.

```bash
cp .env.example .env
```

Get BITTE_API_KEY at [key.bitte.ai](https://key.bitte.ai).

Install dependencies and start development.

```bash
# install dependencies
pnpm i

# start the development server
pnpm dev

# test the agent using make-agent
pnpm make-agent dev

# host the agent on a https url i.e. https://ref-finance-agent.vercel.app

# Add to Bitte Registry using make-agent deploy
pnpm make-agent deploy -u <your-agent-url>

# test the agent using the Bitte Playground (agent-id is url without http or https i.e. ref-finance-agent.vercel.app)
https://wallet.bitte.ai/smart-actions?mode=debug&agentId=<agent-id>

```

## Local Development Using Tunneling

1. Run dev server `pnpm run dev`
2. Activate tunneling service (ngrok, localtunnel, serveo, pinggy, etc.)
3. Deploy a temporary agent `pnpm make-agent deploy -u <tunnel-url>` (agents with tunnel urls are only temporary)
4. Test the agent using the Bitte Playground https://wallet.bitte.ai/smart-actions?mode=debug&agentId=<agent-id>

### Example

```bash
# Run dev server
pnpm run dev

# Activate tunneling service
ngrok http 3000

# Deploy a temporary agent
pnpm make-agent deploy -u https://example-agent.ngrok.app

# Test the agent on the Bitte Wallet Playground
https://wallet.bitte.ai/smart-actions?mode=debug&agentId=example-agent.ngrok.app
```

## Demo

https://github.com/Mintbase/ref-finance-agent-next/assets/838839/3291eaf9-aa79-4c95-8c5f-673a6d72dc96

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

<img src="https://i.imgur.com/fgFX6BS.png" alt="detail_image" width="0"/>
