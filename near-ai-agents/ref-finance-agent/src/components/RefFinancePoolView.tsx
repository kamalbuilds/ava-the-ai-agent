import React, { useEffect, useState } from 'react';
import { RefApiClient } from '../services/api-client';

/**
 * Props for the RefFinancePoolView component
 */
interface RefFinancePoolViewProps {
  numberOfPools?: number;
}

/**
 * Component to display pools from Ref Finance
 */
const RefFinancePoolView: React.FC<RefFinancePoolViewProps> = ({ 
  numberOfPools = 5 
}) => {
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPools = async () => {
      try {
        setLoading(true);
        
        // Create a new RefApiClient for mainnet
        const client = new RefApiClient();
        
        // Fetch pools from the API
        const allPools = await client.fetchPools();
        
        // Sort pools by total liquidity (descending)
        const sortedPools = [...allPools].sort((a, b) => {
          const liquidityA = parseFloat(a.amounts.reduce((sum: number, amount: string) => sum + parseFloat(amount), 0));
          const liquidityB = parseFloat(b.amounts.reduce((sum: number, amount: string) => sum + parseFloat(amount), 0));
          return liquidityB - liquidityA;
        });
        
        // Get top N pools
        const topPools = sortedPools.slice(0, numberOfPools);
        
        // Fetch token metadata for each pool's tokens
        const poolsWithMetadata = await Promise.all(
          topPools.map(async (pool) => {
            const tokensWithMetadata = await Promise.all(
              pool.token_account_ids.map(async (tokenId: string) => {
                try {
                  return await client.getTokenMetadata(tokenId);
                } catch (error) {
                  console.error(`Error fetching metadata for ${tokenId}:`, error);
                  return {
                    id: tokenId,
                    name: tokenId.split('.')[0],
                    symbol: tokenId.split('.')[0].toUpperCase(),
                    decimals: 18
                  };
                }
              })
            );
            
            return {
              ...pool,
              tokens: tokensWithMetadata
            };
          })
        );
        
        setPools(poolsWithMetadata);
        setError(null);
      } catch (err) {
        console.error('Error fetching pools:', err);
        setError('Failed to fetch pools from Ref Finance');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPools();
  }, [numberOfPools]);
  
  // Format amount based on token decimals
  const formatAmount = (amount: string, decimals: number): string => {
    const num = parseFloat(amount) / Math.pow(10, decimals);
    return num.toLocaleString(undefined, { 
      maximumFractionDigits: 6 
    });
  };
  
  if (loading) {
    return <div className="loading">Loading pools...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  if (pools.length === 0) {
    return <div className="no-pools">No pools found</div>;
  }
  
  return (
    <div className="ref-finance-pools">
      <h2>Top {numberOfPools} Ref Finance Pools</h2>
      <div className="pools-list">
        {pools.map((pool) => (
          <div key={pool.id} className="pool-card">
            <div className="pool-header">
              <h3>
                {pool.tokens.map((token: any) => token.symbol).join(' / ')}
              </h3>
              <span className="pool-id">Pool #{pool.id}</span>
            </div>
            
            <div className="pool-info">
              <div className="pool-fee">
                <span>Fee:</span> {pool.total_fee / 100}%
              </div>
              
              <div className="pool-tokens">
                {pool.tokens.map((token: any, index: number) => (
                  <div key={token.id} className="token-info">
                    <div className="token-icon-name">
                      {token.icon && (
                        <img 
                          src={token.icon} 
                          alt={token.symbol} 
                          className="token-icon" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <span>{token.symbol}</span>
                    </div>
                    <div className="token-amount">
                      {formatAmount(pool.amounts[index], token.decimals)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RefFinancePoolView; 