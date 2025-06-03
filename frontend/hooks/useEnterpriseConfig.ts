import { useState, useEffect, useCallback } from 'react';
import { 
  EnterpriseConfigData, 
  EnterpriseConfigResponse, 
  EnterpriseConfigValidation,
  SecurityLevel,
  Environment 
} from '@/types/enterprise/EnterpriseTypes';

interface UseEnterpriseConfigReturn {
  config: EnterpriseConfigData;
  updateConfig: (newConfig: EnterpriseConfigData) => void;
  saveConfig: () => Promise<void>;
  validateConfig: () => EnterpriseConfigValidation;
  resetConfig: () => void;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
}

const DEFAULT_CONFIG: EnterpriseConfigData = {
  general: {
    enabled: true,
    organizationName: '',
    environment: 'development' as Environment,
    maxUsers: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  security: {
    level: 'basic' as SecurityLevel,
    twoFactorAuth: false,
    ssoEnabled: false,
    sessionTimeout: 30,
    encryptionEnabled: true,
    auditLogging: false,
    passwordPolicy: {
      minLength: 8,
      requireSpecialChars: true,
      requireNumbers: true,
      requireUppercase: true,
      expirationDays: 90,
    },
  },
  database: {
    host: 'localhost',
    port: 5432,
    ssl: true,
    maxConnections: 50,
    connectionTimeout: 30,
    backupEnabled: true,
    replicationEnabled: false,
    encryptionAtRest: true,
  },
  network: {
    allowedIPs: ['0.0.0.0/0'],
    proxyUrl: '',
    rateLimit: 1000,
    corsEnabled: true,
    vpnRequired: false,
    firewallRules: {
      inbound: ['443', '80'],
      outbound: ['443', '80', '53'],
    },
  },
  notifications: {
    email: true,
    slack: false,
    webhookUrl: '',
    alertLevels: {
      info: true,
      warning: true,
      error: true,
      critical: true,
    },
    channels: {
      security: '',
      system: '',
      business: '',
    },
  },
  api: {
    apiKey: '',
    version: 'v3',
    timeout: 30,
    retryAttempts: 3,
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 100,
      burstLimit: 200,
    },
    authentication: {
      type: 'bearer',
      refreshTokens: true,
    },
  },
};

export function useEnterpriseConfig(): UseEnterpriseConfigReturn {
  const [config, setConfig] = useState<EnterpriseConfigData>(DEFAULT_CONFIG);
  const [originalConfig, setOriginalConfig] = useState<EnterpriseConfigData>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = JSON.stringify(config) !== JSON.stringify(originalConfig);

  // Load configuration from API
  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/enterprise/config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load configuration: ${response.statusText}`);
      }

      const result: EnterpriseConfigResponse = await response.json();
      
      if (result.success && result.data) {
        setConfig(result.data);
        setOriginalConfig(result.data);
      } else {
        throw new Error(result.error || 'Failed to load configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      // Fallback to default config on error
      setConfig(DEFAULT_CONFIG);
      setOriginalConfig(DEFAULT_CONFIG);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save configuration to API
  const saveConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const validation = validateConfig();
      if (!validation.valid) {
        throw new Error(`Configuration validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      const response = await fetch('/api/enterprise/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          general: {
            ...config.general,
            updatedAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save configuration: ${response.statusText}`);
      }

      const result: EnterpriseConfigResponse = await response.json();
      
      if (result.success && result.data) {
        setOriginalConfig(result.data);
        setConfig(result.data);
      } else {
        throw new Error(result.error || 'Failed to save configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err; // Re-throw for component error handling
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // Update configuration state
  const updateConfig = useCallback((newConfig: EnterpriseConfigData) => {
    setConfig(newConfig);
    setError(null);
  }, []);

  // Validate configuration
  const validateConfig = useCallback((): EnterpriseConfigValidation => {
    const errors = [];
    const warnings = [];

    // Validate general settings
    if (!config.general.organizationName.trim()) {
      errors.push({
        field: 'general.organizationName',
        message: 'Organization name is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (config.general.maxUsers < 1) {
      errors.push({
        field: 'general.maxUsers',
        message: 'Maximum users must be at least 1',
        code: 'INVALID_VALUE',
      });
    }

    // Validate security settings
    if (config.security.sessionTimeout < 5) {
      errors.push({
        field: 'security.sessionTimeout',
        message: 'Session timeout must be at least 5 minutes',
        code: 'INVALID_VALUE',
      });
    }

    if (config.security.level === 'maximum' && !config.security.twoFactorAuth) {
      warnings.push({
        field: 'security.twoFactorAuth',
        message: 'Two-factor authentication is recommended for maximum security level',
        code: 'SECURITY_RECOMMENDATION',
      });
    }

    // Validate database settings
    if (!config.database.host.trim()) {
      errors.push({
        field: 'database.host',
        message: 'Database host is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (config.database.port < 1 || config.database.port > 65535) {
      errors.push({
        field: 'database.port',
        message: 'Database port must be between 1 and 65535',
        code: 'INVALID_VALUE',
      });
    }

    // Validate network settings
    if (config.network.rateLimit < 1) {
      errors.push({
        field: 'network.rateLimit',
        message: 'Rate limit must be at least 1',
        code: 'INVALID_VALUE',
      });
    }

    // Validate API settings
    if (config.api.timeout < 1) {
      errors.push({
        field: 'api.timeout',
        message: 'API timeout must be at least 1 second',
        code: 'INVALID_VALUE',
      });
    }

    if (!config.api.apiKey.trim() && config.general.environment === 'production') {
      errors.push({
        field: 'api.apiKey',
        message: 'API key is required for production environment',
        code: 'REQUIRED_FIELD',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }, [config]);

  // Reset configuration to default
  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setError(null);
  }, []);

  // Load configuration on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    config,
    updateConfig,
    saveConfig,
    validateConfig,
    resetConfig,
    isLoading,
    error,
    isDirty,
  };
}