import { useState, useEffect } from 'react';
import { useZoraCoins } from '../hooks/useZoraCoins';
import { Address } from 'viem';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';

interface ZoraCoinsWidgetProps {
  address: Address;
}

export function ZoraCoinsWidget({ address }: ZoraCoinsWidgetProps) {
  const { loading, error, getProfileBalances, getTrendingCoins } = useZoraCoins();
  const [balances, setBalances] = useState<any>(null);
  const [trendingCoins, setTrendingCoins] = useState<any>(null);
  const { toast } = useToast();
  
  // Fetch profile balances
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const result = await getProfileBalances(address);
        setBalances(result);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to load Zora coin balances',
          variant: 'destructive',
        });
      }
    };
    
    fetchBalances();
  }, [address, getProfileBalances, toast]);
  
  // Fetch trending coins
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const result = await getTrendingCoins('day', 5);
        setTrendingCoins(result);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to load trending Zora coins',
          variant: 'destructive',
        });
      }
    };
    
    fetchTrending();
  }, [getTrendingCoins, toast]);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Zora Coins</CardTitle>
          <CardDescription>Manage your Zora coin portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
          
          {error && (
            <div className="bg-destructive/15 p-3 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          {balances && balances.coinBalances && balances.coinBalances.length > 0 ? (
            <div className="space-y-4">
              {balances.coinBalances.map((balance: any) => (
                <div key={balance.coinAddress} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h3 className="font-medium">{balance.coin.name}</h3>
                    <p className="text-sm text-muted-foreground">${balance.coin.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{parseFloat(balance.balance).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {balances ? "You don't own any Zora coins yet." : "Loading your coins..."}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full">
            View All Coins
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Trending Coins</CardTitle>
          <CardDescription>Popular Zora coins right now</CardDescription>
        </CardHeader>
        <CardContent>
          {trendingCoins && trendingCoins.coins && trendingCoins.coins.length > 0 ? (
            <div className="space-y-4">
              {trendingCoins.coins.map((coin: any) => (
                <div key={coin.address} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h3 className="font-medium">{coin.name}</h3>
                    <p className="text-sm text-muted-foreground">${coin.symbol}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Trade
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {trendingCoins ? "No trending coins available." : "Loading trending coins..."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 