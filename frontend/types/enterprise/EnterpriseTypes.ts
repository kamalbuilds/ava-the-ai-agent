export type SecurityLevel = 'basic' | 'enhanced' | 'maximum';

export type Environment = 'development' | 'staging' | 'production';

export interface GeneralConfig {
  enabled: boolean;
  organizationName: string;
  environment: Environment;
  maxUsers: number;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityConfig {
  level: SecurityLevel;
  twoFactorAuth: boolean;
  ssoEnabled: boolean;
  sessionTimeout: number;
  encryptionEnabled: boolean;
  auditLogging: boolean;
  passwordPolicy: {
    minLength: number;
    requireSpecialChars: boolean;
    requireNumbers: boolean;
    requireUppercase: boolean;
    expirationDays: number;
  };
}

export interface DatabaseConfig {
  host: string;
  port: number;
  ssl: boolean;
  maxConnections: number;
  connectionTimeout: number;
  backupEnabled: boolean;
  replicationEnabled: boolean;
  encryptionAtRest: boolean;
}

export interface NetworkConfig {
  allowedIPs: string[];
  proxyUrl: string;
  rateLimit: number;
  corsEnabled: boolean;
  vpnRequired: boolean;
  firewallRules: {
    inbound: string[];
    outbound: string[];
  };
}

export interface NotificationConfig {
  email: boolean;
  slack: boolean;
  webhookUrl: string;
  alertLevels: {
    info: boolean;
    warning: boolean;
    error: boolean;
    critical: boolean;
  };
  channels: {
    security: string;
    system: string;
    business: string;
  };
}

export interface APIConfig {
  apiKey: string;
  version: string;
  timeout: number;
  retryAttempts: number;
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
    burstLimit: number;
  };
  authentication: {
    type: 'bearer' | 'api-key' | 'oauth';
    refreshTokens: boolean;
  };
}

export interface EnterpriseConfigData {
  general: GeneralConfig;
  security: SecurityConfig;
  database: DatabaseConfig;
  network: NetworkConfig;
  notifications: NotificationConfig;
  api: APIConfig;
}

export interface EnterpriseConfigResponse {
  success: boolean;
  data?: EnterpriseConfigData;
  error?: string;
  timestamp: string;
}

export interface EnterpriseConfigUpdate {
  section: keyof EnterpriseConfigData;
  updates: Partial<EnterpriseConfigData[keyof EnterpriseConfigData]>;
}

export interface ConfigValidationError {
  field: string;
  message: string;
  code: string;
}

export interface EnterpriseConfigValidation {
  valid: boolean;
  errors: ConfigValidationError[];
  warnings: ConfigValidationError[];
}

// Enterprise feature flags
export interface EnterpriseFeatures {
  advancedSecurity: boolean;
  customBranding: boolean;
  ssoIntegration: boolean;
  auditLogs: boolean;
  multiTenant: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  customIntegrations: boolean;
}

// Compliance and regulatory settings
export interface ComplianceConfig {
  gdprCompliant: boolean;
  soc2Certified: boolean;
  hipaaCompliant: boolean;
  dataRetentionDays: number;
  anonymizeData: boolean;
  exportCapabilities: boolean;
}

export interface EnterpriseMetrics {
  activeUsers: number;
  apiCalls: number;
  storageUsed: number;
  dataTransfer: number;
  uptime: number;
  lastBackup: string;
  securityScans: number;
} 