"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Settings, Shield, Database, Network, Bell, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEnterpriseConfig } from '@/hooks/useEnterpriseConfig';
import { EnterpriseConfigData, SecurityLevel, DatabaseConfig } from '@/types/enterprise/EnterpriseTypes';

interface EnterpriseConfigProps {
  onConfigSave?: (config: EnterpriseConfigData) => void;
  className?: string;
  readOnly?: boolean;
}

export function EnterpriseConfig({ onConfigSave, className = "", readOnly = false }: EnterpriseConfigProps) {
  const { config, updateConfig, saveConfig, isLoading, error } = useEnterpriseConfig();
  const [activeTab, setActiveTab] = useState('general');
  const [isDirty, setIsDirty] = useState(false);
  const { toast } = useToast();

  const handleConfigChange = (section: keyof EnterpriseConfigData, key: string, value: any) => {
    if (readOnly) return;
    
    const updatedConfig = {
      ...config,
      [section]: {
        ...config[section],
        [key]: value
      }
    };
    
    updateConfig(updatedConfig);
    setIsDirty(true);
  };

  const handleSaveConfig = async () => {
    try {
      await saveConfig();
      onConfigSave?.(config);
      setIsDirty(false);
      
      toast({
        title: "Configuration Saved",
        description: "Enterprise configuration has been successfully updated",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save enterprise configuration",
        variant: "destructive",
      });
    }
  };

  const securityLevels: { value: SecurityLevel; label: string; description: string }[] = [
    { value: 'basic', label: 'Basic', description: 'Standard security protocols' },
    { value: 'enhanced', label: 'Enhanced', description: 'Advanced security with monitoring' },
    { value: 'maximum', label: 'Maximum', description: 'Highest security with full compliance' }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Settings className="w-8 h-8 text-blue-400" />
            Enterprise Configuration
          </h1>
          <p className="text-gray-400 mt-2">
            Advanced setup and configuration options for enterprise deployment
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={config.general.enabled ? "default" : "secondary"}>
            {config.general.enabled ? "🟢 Active" : "🔴 Inactive"}
          </Badge>
          {!readOnly && (
            <Button
              onClick={handleSaveConfig}
              disabled={!isDirty || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Save Configuration
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="bg-red-900/20 border-red-700">
          <CardContent className="p-4">
            <p className="text-red-300">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-gray-800">
          <TabsTrigger value="general" className="flex items-center gap-1">
            <Settings className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-1">
            <Database className="w-4 h-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="network" className="flex items-center gap-1">
            <Network className="w-4 h-4" />
            Network
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-1">
            <Key className="w-4 h-4" />
            API Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-enterprise"
                  checked={config.general.enabled}
                  onCheckedChange={(checked) => handleConfigChange('general', 'enabled', checked)}
                  disabled={readOnly}
                />
                <Label htmlFor="enable-enterprise" className="text-white">Enable Enterprise Features</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="organization-name" className="text-white">Organization Name</Label>
                <Input
                  id="organization-name"
                  value={config.general.organizationName}
                  onChange={(e) => handleConfigChange('general', 'organizationName', e.target.value)}
                  placeholder="Enter organization name"
                  disabled={readOnly}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="environment" className="text-white">Environment</Label>
                <Select
                  value={config.general.environment}
                  onValueChange={(value) => handleConfigChange('general', 'environment', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-users" className="text-white">Maximum Users</Label>
                <Input
                  id="max-users"
                  type="number"
                  value={config.general.maxUsers}
                  onChange={(e) => handleConfigChange('general', 'maxUsers', parseInt(e.target.value))}
                  placeholder="Enter maximum users"
                  disabled={readOnly}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Security Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="security-level" className="text-white">Security Level</Label>
                <Select
                  value={config.security.level}
                  onValueChange={(value: SecurityLevel) => handleConfigChange('security', 'level', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select security level" />
                  </SelectTrigger>
                  <SelectContent>
                    {securityLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-sm text-gray-400">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-2fa"
                  checked={config.security.twoFactorAuth}
                  onCheckedChange={(checked) => handleConfigChange('security', 'twoFactorAuth', checked)}
                  disabled={readOnly}
                />
                <Label htmlFor="enable-2fa" className="text-white">Enable Two-Factor Authentication</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-sso"
                  checked={config.security.ssoEnabled}
                  onCheckedChange={(checked) => handleConfigChange('security', 'ssoEnabled', checked)}
                  disabled={readOnly}
                />
                <Label htmlFor="enable-sso" className="text-white">Enable Single Sign-On (SSO)</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout" className="text-white">Session Timeout (minutes)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value={config.security.sessionTimeout}
                  onChange={(e) => handleConfigChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  placeholder="Enter session timeout"
                  disabled={readOnly}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Database Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="db-host" className="text-white">Database Host</Label>
                <Input
                  id="db-host"
                  value={config.database.host}
                  onChange={(e) => handleConfigChange('database', 'host', e.target.value)}
                  placeholder="Enter database host"
                  disabled={readOnly}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="db-port" className="text-white">Database Port</Label>
                <Input
                  id="db-port"
                  type="number"
                  value={config.database.port}
                  onChange={(e) => handleConfigChange('database', 'port', parseInt(e.target.value))}
                  placeholder="Enter database port"
                  disabled={readOnly}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-ssl"
                  checked={config.database.ssl}
                  onCheckedChange={(checked) => handleConfigChange('database', 'ssl', checked)}
                  disabled={readOnly}
                />
                <Label htmlFor="enable-ssl" className="text-white">Enable SSL Connection</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-connections" className="text-white">Maximum Connections</Label>
                <Input
                  id="max-connections"
                  type="number"
                  value={config.database.maxConnections}
                  onChange={(e) => handleConfigChange('database', 'maxConnections', parseInt(e.target.value))}
                  placeholder="Enter max connections"
                  disabled={readOnly}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Network Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="allowed-ips" className="text-white">Allowed IP Addresses</Label>
                <Textarea
                  id="allowed-ips"
                  value={config.network.allowedIPs.join('\n')}
                  onChange={(e) => handleConfigChange('network', 'allowedIPs', e.target.value.split('\n').filter(ip => ip.trim()))}
                  placeholder="Enter IP addresses (one per line)"
                  disabled={readOnly}
                  className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proxy-url" className="text-white">Proxy URL</Label>
                <Input
                  id="proxy-url"
                  value={config.network.proxyUrl}
                  onChange={(e) => handleConfigChange('network', 'proxyUrl', e.target.value)}
                  placeholder="Enter proxy URL (optional)"
                  disabled={readOnly}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate-limit" className="text-white">Rate Limit (requests per minute)</Label>
                <Input
                  id="rate-limit"
                  type="number"
                  value={config.network.rateLimit}
                  onChange={(e) => handleConfigChange('network', 'rateLimit', parseInt(e.target.value))}
                  placeholder="Enter rate limit"
                  disabled={readOnly}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="email-notifications"
                  checked={config.notifications.email}
                  onCheckedChange={(checked) => handleConfigChange('notifications', 'email', checked)}
                  disabled={readOnly}
                />
                <Label htmlFor="email-notifications" className="text-white">Email Notifications</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="slack-notifications"
                  checked={config.notifications.slack}
                  onCheckedChange={(checked) => handleConfigChange('notifications', 'slack', checked)}
                  disabled={readOnly}
                />
                <Label htmlFor="slack-notifications" className="text-white">Slack Notifications</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-url" className="text-white">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  value={config.notifications.webhookUrl}
                  onChange={(e) => handleConfigChange('notifications', 'webhookUrl', e.target.value)}
                  placeholder="Enter webhook URL"
                  disabled={readOnly}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key" className="text-white">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={config.api.apiKey}
                  onChange={(e) => handleConfigChange('api', 'apiKey', e.target.value)}
                  placeholder="Enter API key"
                  disabled={readOnly}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-version" className="text-white">API Version</Label>
                <Select
                  value={config.api.version}
                  onValueChange={(value) => handleConfigChange('api', 'version', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select API version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="v1">v1.0</SelectItem>
                    <SelectItem value="v2">v2.0</SelectItem>
                    <SelectItem value="v3">v3.0 (Latest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-timeout" className="text-white">Request Timeout (seconds)</Label>
                <Input
                  id="request-timeout"
                  type="number"
                  value={config.api.timeout}
                  onChange={(e) => handleConfigChange('api', 'timeout', parseInt(e.target.value))}
                  placeholder="Enter request timeout"
                  disabled={readOnly}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EnterpriseConfig; 