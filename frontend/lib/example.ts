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