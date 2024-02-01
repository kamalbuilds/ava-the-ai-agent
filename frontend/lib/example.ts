export const EXAMPLE_RESPONSES = {
    "I have 10 AVAX and want to optimize my portfolio between lending, liquidity provision, and trading. What's the best strategy right now?": [
        // Portfolio Manager Initial Analysis
        {
            role: "assistant",
            content: "Analyzing your 10 AVAX portfolio allocation request. Given current market conditions, we should evaluate lending rates, LP opportunities, and trading pairs. Let me consult our specialized agents.",
            agentName: "Portfolio Manager",
            collaborationType: "analysis",
            timestamp: "10:30 AM"
        },

        // DeFi Analytics Agent Response
        {
            role: "assistant",
            content: "Current market analysis:\n- Aave AVAX lending APY: 1,77%\n- Uniswap AVAX-USDC pool APR: 43.893%\n- Curve Blizz pool APY: 1.58%\nTotal DeFi TVL trend is up 5% this week, suggesting growing stability.",
            agentName: "DeFi Analytics",
            collaborationType: "suggestion",
            timestamp: "10:31 AM"
        },

        // Liquidity Pool Agent Response
        {
            role: "assistant",
            content: "Recommended LP allocation:\n1. AVAX-USDC Uniswap V3 (concentrated liquidity 1800-2200): 4 AVAX\n2. blizz Curve: 3 AVAX\nCurrent impermanent loss risk: Moderate",
            agentName: "Liquidity Pool Agent",
            collaborationType: "suggestion",
            timestamp: "10:31 AM"
        },

        // Trading Agent Response
        {
            role: "assistant",
            content: "Market conditions favor keeping 3 AVAX in spot for potential swing trading. Key resistance at $2,200, support at $1,850. Set up limit orders at these levels.",
            agentName: "Trading Agent",
            collaborationType: "suggestion",
            timestamp: "10:32 AM"
        },

        // Portfolio Manager Final Consensus
        {
            role: "assistant",
            content: "Based on all analyses, here's your optimized portfolio strategy for 10 AVAX:\n\n1. Liquidity Provision (7 AVAX):\n   - 4 AVAX in Uniswap AVAX-USDC\n   - 3 AVAX in Curve blizz pool\n\n2. Trading Reserve (3 AVAX):\n   - Set limit orders at $2,200 and $1,850\n\nRationale: This allocation maximizes yield while maintaining trading flexibility. Expected monthly yield: ~10.5% APY\n\nShall I provide step-by-step implementation instructions?",
            agentName: "Portfolio Manager",
            collaborationType: "decision",
            timestamp: "10:32 AM"
        }
    ],
    "What are the best yield opportunities across DeFi right now, considering risks and TVL?": [
        // Portfolio Manager Initial Analysis
        {
            role: "assistant",
            content: "I'll analyze current DeFi yield opportunities with a focus on risk assessment and TVL stability. Let me coordinate with our specialists.",
            agentName: "Portfolio Manager",
            collaborationType: "analysis",
            timestamp: "2:45 PM"
        },

        // DeFi Analytics Agent
        {
            role: "assistant",
            content: "Protocol TVL Analysis:\n1. AAVE: $5.2B (↑2% week)\n2. Curve: $3.8B (stable)\n3. Convex: $3.1B (↑5% week)\n\nRisk Metrics:\n- Smart Contract Risk: Low-Medium\n- Protocol Maturity: High\n- Audit Status: All Recently Audited",
            agentName: "DeFi Analytics",
            collaborationType: "suggestion",
            timestamp: "2:46 PM"
        },

        // Liquidity Agent
        {
            role: "assistant",
            content: "Top Stable Opportunities:\n1. Curve tricrypto pool: 8.2% APY\n2. Convex stETH pool: 7.5% APY\n3. AAVE USDC lending: 4.8% APY\n\nVolatility Index: Low for all mentioned pools",
            agentName: "Liquidity Pool Agent",
            collaborationType: "suggestion",
            timestamp: "2:46 PM"
        },

        // Trading Agent
        {
            role: "assistant",
            content: "Market Correlation Analysis:\n- Curve pools showing 0.3 correlation with ETH price\n- Lending rates expected to increase with upcoming Fed meeting\n- Volume analysis suggests stable liquidity in major pools",
            agentName: "Trading Agent",
            collaborationType: "suggestion",
            timestamp: "2:47 PM"
        },

        // Final Consensus
        {
            role: "assistant",
            content: "Based on comprehensive analysis, here are the top yield opportunities ranked by risk-adjusted returns:\n\n1. Best Safe Yield:\n   - Curve tricrypto pool (8.2% APY)\n   - Risk: Low, TVL: $825M\n\n2. Best Moderate Risk:\n   - Convex stETH pool (7.5% APY)\n   - Additional CRV rewards possible\n\n3. Best Conservative:\n   - AAVE USDC lending (4.8% APY)\n   - Lowest risk, highest liquidity\n\nRecommended Strategy:\n- Split allocation: 40% tricrypto, 40% stETH, 20% lending\n- Set up alerts for rate changes above 2%\n\nWould you like detailed entry instructions for any of these opportunities?",
            agentName: "Portfolio Manager",
            collaborationType: "decision",
            timestamp: "2:47 PM"
        }
    ],

};

export const AUTONOMOUS_EXAMPLES = {
    "Portfolio Rebalancing": {
      query: "I have $200 in my wallet on Mantle. Can you analyze my portfolio and suggest optimizations?",
      systemPrompt: "Initiating comprehensive DeFi portfolio analysis on Mantle network",
      responses: [
        {
          role: "assistant",
          content: "📊 DeFi Portfolio Report - Mantle Network\n\nCurrent Portfolio ($200):\n- USDC: $120 (60%)\n- WETH: $50 (25%)\n- MNT: $30 (15%)\n\nKey Market Insights:\n- Stargate finance is up 10% this week\n- WETH/USDC pool APY: 15.2%\n- MNT staking rewards: 8.5% APR\n- Agni Finance lending rates: USDC 5.8%, WETH 3.2%",
          agentName: "Observer Agent",
          collaborationType: "analysis",
          timestamp: ""
        },
        {
          role: "assistant",
          content: "Task Analysis: Portfolio requires rebalancing to maximize yield. Current allocation is too conservative with high USDC holdings. Identified opportunities in Agni Finance and Mantle DEX pools.",
          agentName: "Task Manager",
          collaborationType: "analysis",
          timestamp: ""
        },
        {
          role: "assistant",
          content: "hey anon, i've been watching these pools closely. the mETH-USDT pool on mantle dex is pretty based rn. impermanent loss risk is minimal given the price correlation. might be worth aping a bit more into that.",
          agentName: "Eliza",
          collaborationType: "suggestion",
          timestamp: ""
        },
        {
          role: "assistant",
          content: "Executing rebalancing strategy:\n1. Converting $25 USDC to mETH  via Squid Router \n2. Adding mETH-USDC liquidity position ($50)\n3. Swapping remaining USDC ($70) and Depositing into Agni Finance mETH-USDT lending pool\n\nNew Portfolio Allocation:\n- mETH-USDC LP: $80 (40%) - Est. APY 18.5%\n- USDC lending: $70 (35%) - APY 5.8%\n- MNT: $50 (25%) - Staking APR 8.5%\n\nExpected Portfolio Yield: ~12.4% APY",
          agentName: "Executor Agent",
          collaborationType: "execution",
          timestamp: ""
        }
      ]
    },
    "Liquidity Provisioning": {
      query: "What's the best way to provide liquidity with my $200 on Mantle DEX?",
      systemPrompt: "Analyzing Mantle DEX liquidity pools and market conditions",
      responses: [
        {
          role: "assistant",
          content: "🔍 Mantle DEX Liquidity Analysis\n\nTop Performing Pools:\n1. WETH/USDC: $2.5M TVL, 15.2% APY\n2. MNT/USDC: $1.8M TVL, 12.8% APY\n3. WETH/MNT: $1.2M TVL, 18.5% APY\n\nRisk Metrics:\n- Price correlation: WETH/MNT (0.85)\n- 24h Volume: $1.2M\n- IL Risk: Low-Medium",
          agentName: "Observer Agent",
          collaborationType: "analysis",
          timestamp: ""
        },
        {
          role: "assistant",
          content: "looks like you're interested in LP farming anon. i've been monitoring these pools and the WETH/MNT pair is pretty solid. fees are bussin and IL hasn't been too bad. degen play would be the new wmnt/usdc pool but that's more risky.",
          agentName: "Eliza",
          collaborationType: "suggestion",
          timestamp: ""
        },
        {
          role: "assistant",
          content: "Recommended Strategy: Split liquidity between WETH/MNT and USDC/MNT pools to diversify risk while maximizing returns. Current market conditions favor balanced exposure to both pairs.",
          agentName: "Task Manager",
          collaborationType: "suggestion",
          timestamp: ""
        },
        {
          role: "assistant",
          content: "Executing liquidity provision strategy:\n\n1. Split funds:\n   - $100 to WETH/MNT pool\n   - $100 to USDC/MNT pool\n\n2. Transactions completed:\n   - Swapped $50 to WETH\n   - Swapped $100 to MNT\n   - Added liquidity positions\n\nFinal Position:\n- WETH/MNT LP: $100 (Est. APY 18.5%)\n- USDC/MNT LP: $100 (Est. APY 12.8%)\n\nTotal Expected Yield: ~15.65% APY\nTransaction fees paid: $0.85",
          agentName: "Executor Agent",
          collaborationType: "execution",
          timestamp: ""
        }
      ]
    },
    "Yield Farming": {
      query: "Find me the best yield farming strategy for $200 on Mantle",
      systemPrompt: "Analyzing yield farming opportunities across Mantle DeFi protocols",
      responses: [
        {
          role: "assistant",
          content: "📈 Yield Farming Opportunities Report\n\nProtocol APYs:\n1. Agni Finance\n   - USDC Lending: 5.8%\n   - WETH Lending: 3.2%\n   - MNT Farming: 14.5%\n\n2. Mantle DEX\n   - WETH/MNT LP + Rewards: 18.5%\n   - USDC/MNT LP + Rewards: 12.8%\n\n3. Fusionist\n   - NFT Staking: 22% (requires NFT)\n   - Token Staking: 16.2%",
          agentName: "Observer Agent",
          collaborationType: "analysis",
          timestamp: ""
        },
        {
          role: "assistant",
          content: "yo fren, been farming on mantle since launch. fusionist's looking pretty juicy rn but you need their nft. agni x mantle dex combo is the 200iq play - stack those yields without the nft requirement.",
          agentName: "Eliza",
          collaborationType: "suggestion",
          timestamp: ""
        },
        {
          role: "assistant",
          content: "Optimal Strategy Identified: Leverage Agni Finance lending with Mantle DEX farming for maximum yields. Will implement multi-step yield farming position.",
          agentName: "Task Manager",
          collaborationType: "suggestion",
          timestamp: ""
        },
        {
          role: "assistant",
          content: "Executing yield farming strategy:\n\n1. Initial Setup:\n   - Deposited $100 USDC in Agni Finance (5.8% APY)\n   - Borrowed $50 MNT against USDC (2.5% interest)\n\n2. Liquidity Position:\n   - Added $100 + borrowed $50 to WETH/MNT LP\n   - Staked LP tokens for additional rewards\n\nFinal Position:\n- Agni Finance Lending: $100 (5.8% APY)\n- WETH/MNT LP + Rewards: $150 (18.5% APY)\n- Net APY after borrowing costs: ~16.2%\n\nTotal Expected Annual Yield: $32.40 (16.2%)\nPosition can be boosted through reward token compounding",
          agentName: "Executor Agent",
          collaborationType: "execution",
          timestamp: ""
        }
      ]
    }
  };