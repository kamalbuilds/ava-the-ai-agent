import { EnterpriseConfigData, EnterpriseConfigValidation } from '@/types/enterprise/EnterpriseTypes';

export interface ConfigExportOptions {
  includeSecrets: boolean;
  format: 'json' | 'yaml' | 'env';
  sections?: (keyof EnterpriseConfigData)[];
}

export interface ConfigImportResult {
  success: boolean;
  config?: EnterpriseConfigData;
  errors: string[];
  warnings: string[];
}

/**
 * Export enterprise configuration to different formats
 */
export function exportConfig(
  config: EnterpriseConfigData, 
  options: ConfigExportOptions = { includeSecrets: false, format: 'json' }
): string {
  const exportConfig = { ...config };
  
  // Remove secrets if not explicitly included
  if (!options.includeSecrets) {
    exportConfig.api.apiKey = '[REDACTED]';
    exportConfig.database.host = exportConfig.database.host.includes('localhost') ? 
      exportConfig.database.host : '[REDACTED]';
  }

  // Filter sections if specified
  if (options.sections && options.sections.length > 0) {
    const filteredConfig: Partial<EnterpriseConfigData> = {};
    options.sections.forEach(section => {
      filteredConfig[section] = exportConfig[section] as any;
    });
    return formatExport(filteredConfig, options.format);
  }

  return formatExport(exportConfig, options.format);
}

/**
 * Format configuration data for export
 */
function formatExport(config: any, format: 'json' | 'yaml' | 'env'): string {
  switch (format) {
    case 'json':
      return JSON.stringify(config, null, 2);
    
    case 'yaml':
      return convertToYaml(config);
    
    case 'env':
      return convertToEnv(config);
    
    default:
      return JSON.stringify(config, null, 2);
  }
}

/**
 * Convert config object to YAML format
 */
function convertToYaml(obj: any, indent = 0): string {
  const spaces = '  '.repeat(indent);
  let yaml = '';

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      yaml += `${spaces}${key}: null\n`;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      yaml += `${spaces}${key}:\n`;
      yaml += convertToYaml(value, indent + 1);
    } else if (Array.isArray(value)) {
      yaml += `${spaces}${key}:\n`;
      value.forEach(item => {
        yaml += `${spaces}  - ${item}\n`;
      });
    } else if (typeof value === 'string') {
      yaml += `${spaces}${key}: "${value}"\n`;
    } else {
      yaml += `${spaces}${key}: ${value}\n`;
    }
  }

  return yaml;
}

/**
 * Convert config object to environment variables format
 */
function convertToEnv(obj: any, prefix = 'AVA'): string {
  let env = '';
  
  function flattenObject(obj: any, currentPrefix: string): void {
    for (const [key, value] of Object.entries(obj)) {
      const envKey = `${currentPrefix}_${key.toUpperCase()}`;
      
      if (value === null || value === undefined) {
        env += `${envKey}=\n`;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        flattenObject(value, envKey);
      } else if (Array.isArray(value)) {
        env += `${envKey}=${value.join(',')}\n`;
      } else {
        env += `${envKey}=${value}\n`;
      }
    }
  }

  flattenObject(obj, prefix);
  return env;
}

/**
 * Import configuration from JSON string
 */
export function importConfig(configString: string, format: 'json' | 'yaml' | 'env' = 'json'): ConfigImportResult {
  const result: ConfigImportResult = {
    success: false,
    errors: [],
    warnings: []
  };

  try {
    let parsedConfig: any;

    switch (format) {
      case 'json':
        parsedConfig = JSON.parse(configString);
        break;
      
      case 'yaml':
        parsedConfig = parseYaml(configString);
        break;
      
      case 'env':
        parsedConfig = parseEnv(configString);
        break;
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Validate structure
    const validationResult = validateImportedConfig(parsedConfig);
    result.errors = validationResult.errors;
    result.warnings = validationResult.warnings;

    if (validationResult.errors.length === 0) {
      result.success = true;
      result.config = parsedConfig as EnterpriseConfigData;
    }

  } catch (error) {
    result.errors.push(`Failed to parse ${format.toUpperCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Basic YAML parser (simplified implementation)
 */
function parseYaml(yamlString: string): any {
  const lines = yamlString.split('\n');
  const result: any = {};
  const stack: any[] = [result];

  for (const line of lines) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    const indent = line.match(/^\s*/)?.[0].length || 0;
    const content = line.trim();
    
    if (content.includes(':')) {
      const [key, ...valueParts] = content.split(':');
      const value = valueParts.join(':').trim();
      
      if (!key) continue;
      
      // Handle different indent levels
      while (stack.length > Math.floor(indent / 2) + 1) {
        stack.pop();
      }
      
      const current = stack[stack.length - 1];
      
      if (value === '' || value === null) {
        current[key.trim()] = {};
        stack.push(current[key.trim()]);
      } else {
        current[key.trim()] = parseValue(value);
      }
    }
  }

  return result;
}

/**
 * Parse environment variables format
 */
function parseEnv(envString: string): any {
  const lines = envString.split('\n');
  const result: any = {};

  for (const line of lines) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    const [key, ...valueParts] = line.split('=');
    if (!key || !valueParts.length) continue;

    const value = valueParts.join('=');
    const keys = key.split('_').map(k => k.toLowerCase());
    
    if (keys.length < 2) continue; // Skip invalid keys
    
    let current = result;
    for (let i = 1; i < keys.length - 1; i++) {
      const currentKey = keys[i];
      if (currentKey && !current[currentKey]) {
        current[currentKey] = {};
      }
      if (currentKey) {
        current = current[currentKey];
      }
    }
    
    const finalKey = keys[keys.length - 1];
    if (finalKey) {
      current[finalKey] = parseValue(value);
    }
  }

  return result;
}

/**
 * Parse value from string
 */
function parseValue(value: string): any {
  const trimmed = value.trim();
  
  // Remove quotes
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  
  // Parse boolean
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  
  // Parse number
  if (!isNaN(Number(trimmed))) return Number(trimmed);
  
  // Parse array (comma-separated)
  if (trimmed.includes(',')) {
    return trimmed.split(',').map(item => parseValue(item.trim()));
  }
  
  return trimmed;
}

/**
 * Validate imported configuration structure
 */
function validateImportedConfig(config: any): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required sections
  const requiredSections = ['general', 'security', 'database', 'network', 'notifications', 'api'];
  
  for (const section of requiredSections) {
    if (!config[section]) {
      errors.push(`Missing required section: ${section}`);
    }
  }

  // Check general section
  if (config.general) {
    if (typeof config.general.enabled !== 'boolean') {
      errors.push('general.enabled must be a boolean');
    }
    if (!config.general.organizationName) {
      warnings.push('general.organizationName is not set');
    }
  }

  // Check security section
  if (config.security) {
    const validSecurityLevels = ['basic', 'enhanced', 'maximum'];
    if (!validSecurityLevels.includes(config.security.level)) {
      errors.push(`security.level must be one of: ${validSecurityLevels.join(', ')}`);
    }
  }

  // Check database section
  if (config.database) {
    if (config.database.port && (config.database.port < 1 || config.database.port > 65535)) {
      errors.push('database.port must be between 1 and 65535');
    }
  }

  return { errors, warnings };
}

/**
 * Download configuration as file
 */
export function downloadConfig(config: EnterpriseConfigData, filename: string, options: ConfigExportOptions): void {
  const content = exportConfig(config, options);
  const blob = new Blob([content], { type: getContentType(options.format) });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get content type for file format
 */
function getContentType(format: string): string {
  switch (format) {
    case 'json':
      return 'application/json';
    case 'yaml':
      return 'application/x-yaml';
    case 'env':
      return 'text/plain';
    default:
      return 'text/plain';
  }
} 