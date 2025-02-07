'use client';

import { useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { MainLayout } from '@/components/layouts/MainLayout';

export default function SettingsPage() {
  const { settings, updateAIProvider, updateWalletKey, updateAdditionalSettings, togglePrivateCompute } = useSettingsStore();
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateAIProvider({
      ...settings.aiProvider,
      provider: e.target.value as 'openai' | 'atoma'
    });
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error('Connection test failed');
      alert('Connection successful!');
    } catch (error) {
      alert('Connection failed: ' + error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Saving settings', settings);
    updateAIProvider({
      provider: settings.aiProvider.provider,
      apiKey: settings.aiProvider.apiKey,
      modelName: settings.aiProvider.modelName
    });
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Agent Settings</h1>

        <form onSubmit={handleSubmit}>
          {/* AI Provider Settings */}
          <section className="rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">AI Provider Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Provider</label>
                <select 
                  value={settings.aiProvider.provider}
                  onChange={handleProviderChange}
                  className="w-full border rounded-md p-2 bg-black"
                >
                  <option value="openai">OpenAI</option>
                  <option value="atoma">Atoma (Private Compute)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <input
                  type="password"
                  value={settings.aiProvider.apiKey}
                  onChange={(e) => updateAIProvider({
                    ...settings.aiProvider,
                    apiKey: e.target.value
                  })}
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Model Name</label>
              <select 
                value={settings.aiProvider.modelName}
                onChange={(e) => updateAIProvider({
                  ...settings.aiProvider,
                  modelName: e.target.value
                })}
                className="w-full border rounded-md p-2 bg-black"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="deepseek-r1">DeepSeek-R1</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
              </div>

              {settings.aiProvider.provider === 'atoma' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.enablePrivateCompute}
                    onChange={togglePrivateCompute}
                    id="private-compute"
                  />
                  <label htmlFor="private-compute">
                    Enable Private Compute (TEE Protection)
                  </label>
                </div>
              )}
            </div>
          </section>

          {/* Additional API Keys */}
          <section className="rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Additional API Keys</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Wallet Private Key</label>
                <input
                  type="password"
                  value={settings.walletKey}
                  onChange={(e) => updateWalletKey(e.target.value)}
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Brian API Key</label>
                <input
                  type="password"
                  value={settings.additionalSettings.brianApiKey || ''}
                  onChange={(e) => updateAdditionalSettings({ brianApiKey: e.target.value })}
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">CoinGecko API Key</label>
                <input
                  type="password"
                  value={settings.additionalSettings.coingeckoApiKey || ''}
                  onChange={(e) => updateAdditionalSettings({ coingeckoApiKey: e.target.value })}
                  className="w-full border rounded-md p-2"
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Save Settings
          </button>
        </form>

        <button
          onClick={handleTestConnection}
          disabled={isTestingConnection}
          className="bg-blue-500 hover:bg-blue-600  px-4 py-2 rounded-md"
        >
          {isTestingConnection ? 'Testing...' : 'Test Connection'}
        </button>
      </div>
    </MainLayout>
  );
} 