"use client";

import { ChatOpenAI } from "@langchain/openai";
import { createBrianAgent } from "@brian-ai/langchain";

export const initializeAgent = async (config: {
    brianApiKey: string;
    privateKey: string;
    openAiKey: string;
}) => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const agent = await createBrianAgent({
            apiKey: config.brianApiKey,
            privateKeyOrAccount: config.privateKey as `0x${string}`,
            llm: new ChatOpenAI({
                apiKey: config.openAiKey,
                modelName: "gpt-4o",
                temperature: 0.2
            }),
        });

        return agent;
    } catch (error) {
        console.error("Agent initialization failed:", error);
        return null;
    }
};

export const CONFIG = {
    SUPPORTED_CHAINS: ['avalanche', 'mode', 'base'],
    DEFAULT_RISK_LEVEL: 5,
    MAX_TRADE_SIZE: '1000000000000000000', // 1 TOKEN
    REFRESH_INTERVAL: 10000, // 10 seconds
    GELATO_RELAY_API_KEY: process.env['NEXT_PUBLIC_GELATO_API_KEY'] || '',

    // Contract addresses per network
    ADDRESSES: {
        avalanche: {
            dex: '0x...',
            aiAgent: '0x...',
            tokenA: '0x...',
            tokenB: '0x...'
        },
        mode: {
            dex: '0x...',
            aiAgent: '0x...',
            tokenA: '0x...',
            tokenB: '0x...'
        },
        base: {
            dex: '0x...',
            aiAgent: '0x...',
            tokenA: '0x...',
            tokenB: '0x...'
        }
    }
};