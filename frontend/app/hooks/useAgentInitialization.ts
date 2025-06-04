import { useEffect, useState } from 'react';
import { useAddress, useWallet } from 'thirdweb/react';
import { initializeAgents } from '../agents';
import type { Agent } from '../agents';

export const useAgentInitialization = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const address = useAddress();
    const wallet = useWallet();

    useEffect(() => {
        const initAgents = async () => {
            if (!address || !wallet) {
                setError("Please connect your wallet first");
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const initializedAgents = await initializeAgents(wallet);
                setAgents(initializedAgents);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to initialize agents");
            } finally {
                setLoading(false);
            }
        };

        initAgents();
    }, [address, wallet]);

    return { agents, loading, error };
};
