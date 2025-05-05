'use client';

import { useState } from 'react';
import { ZoraCoinsWidget } from '../../components/ZoraCoinsWidget';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useZoraCoins } from '../../hooks/useZoraCoins';

export default function ZoraCoinsPage() {
  const [connectedAddress, setConnectedAddress] = useState<string>('0xYourConnectedWalletAddress');
  const { createCoin, loading, error } = useZoraCoins();
  
  const [coinData, setCoinData] = useState({
    name: '',
    symbol: '',
    uri: '',
    payoutRecipient: ''
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCoinData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCreateCoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createCoin({
        ...coinData,
        payoutRecipient: coinData.payoutRecipient as any,
        account: connectedAddress as any,
      });
      
      // Reset form after successful creation
      setCoinData({
        name: '',
        symbol: '',
        uri: '',
        payoutRecipient: ''
      });
      
      alert('Coin created successfully!');
    } catch (err) {
      console.error('Error creating coin:', err);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Zora Coins</h1>
      
      <Tabs defaultValue="portfolio">
        <TabsList className="mb-6">
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="create">Create Coin</TabsTrigger>
          <TabsTrigger value="explore">Explore Coins</TabsTrigger>
        </TabsList>
        
        <TabsContent value="portfolio">
          <div className="grid md:grid-cols-2 gap-6">
            <ZoraCoinsWidget address={connectedAddress as any} />
            
            <Card>
              <CardHeader>
                <CardTitle>Create Your Coin</CardTitle>
                <CardDescription>
                  Create your own coin on Zora to monetize your content and grow your community.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Creating a coin allows you to:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
                  <li>Tokenize your content or brand</li>
                  <li>Earn from trading activity</li>
                  <li>Build a community around your projects</li>
                  <li>Get discovered by new users</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="default" className="w-full" onClick={() => document.querySelector('[data-value="create"]')?.click()}>
                  Create a Coin
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create a New Coin</CardTitle>
              <CardDescription>
                Fill out the form below to create your own Zora coin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCoin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Coin Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="My Awesome Coin"
                    value={coinData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    name="symbol"
                    placeholder="MAC"
                    value={coinData.symbol}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    A short abbreviation for your coin, typically 3-5 characters.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="uri">Metadata URI</Label>
                  <Input
                    id="uri"
                    name="uri"
                    placeholder="ipfs://..."
                    value={coinData.uri}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    IPFS URI for your coin's metadata (image, description, etc.)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payoutRecipient">Payout Recipient</Label>
                  <Input
                    id="payoutRecipient"
                    name="payoutRecipient"
                    placeholder="0x..."
                    value={coinData.payoutRecipient}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The wallet address that will receive creator earnings.
                  </p>
                </div>
                
                {error && (
                  <div className="bg-destructive/15 p-3 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Coin'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="explore">
          <Card>
            <CardHeader>
              <CardTitle>Explore Coins</CardTitle>
              <CardDescription>
                Discover trending coins on Zora.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                This feature is coming soon. Stay tuned for updates!
              </p>
              
              <div className="bg-muted p-6 rounded-md text-center">
                <h3 className="text-lg font-medium mb-2">Want to build this feature?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Join us in building the next generation of social tokens.
                </p>
                <Button variant="outline">Learn More</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 