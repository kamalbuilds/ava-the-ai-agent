"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { 
  EnterpriseConfigValidation,
  ConfigValidationError,
  EnterpriseConfigData 
} from '@/types/enterprise/EnterpriseTypes';

interface EnterpriseConfigValidationProps {
  validation: EnterpriseConfigValidation;
  config: EnterpriseConfigData;
  className?: string;
}

export function EnterpriseConfigValidationComponent({ 
  validation, 
  config, 
  className = "" 
}: EnterpriseConfigValidationProps) {
  const getStatusIcon = () => {
    if (validation.valid) {
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  const getStatusBadge = () => {
    if (validation.valid) {
      return <Badge className="bg-green-600 text-green-100">Valid Configuration</Badge>;
    }
    return <Badge className="bg-red-600 text-red-100">Invalid Configuration</Badge>;
  };

  const getSeverityIcon = (type: 'error' | 'warning') => {
    return type === 'error' ? 
      <XCircle className="w-4 h-4 text-red-400" /> : 
      <AlertTriangle className="w-4 h-4 text-yellow-400" />;
  };

  const getFieldLabel = (field: string): string => {
    const fieldMap: Record<string, string> = {
      'general.organizationName': 'Organization Name',
      'general.maxUsers': 'Maximum Users',
      'security.sessionTimeout': 'Session Timeout',
      'security.twoFactorAuth': 'Two-Factor Authentication',
      'database.host': 'Database Host',
      'database.port': 'Database Port',
      'network.rateLimit': 'Rate Limit',
      'api.timeout': 'API Timeout',
      'api.apiKey': 'API Key',
    };
    return fieldMap[field] || field;
  };

  const getConfigurationScore = (): number => {
    const totalChecks = 20; // Total number of validation checks
    const errorCount = validation.errors.length;
    const warningCount = validation.warnings.length;
    
    const score = Math.max(0, totalChecks - (errorCount * 2) - (warningCount * 0.5));
    return Math.round((score / totalChecks) * 100);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const configScore = getConfigurationScore();

  const securityRecommendations = [
    {
      condition: config.security.level === 'basic',
      message: 'Consider upgrading to enhanced or maximum security level for better protection',
      type: 'info' as const,
    },
    {
      condition: !config.security.twoFactorAuth && config.general.environment === 'production',
      message: 'Enable two-factor authentication for production environments',
      type: 'warning' as const,
    },
    {
      condition: !config.database.ssl,
      message: 'SSL should be enabled for database connections in production',
      type: 'warning' as const,
    },
    {
      condition: config.network.allowedIPs.includes('0.0.0.0/0'),
      message: 'Consider restricting IP access instead of allowing all IPs',
      type: 'info' as const,
    },
    {
      condition: !config.api.apiKey && config.general.environment !== 'development',
      message: 'API key should be configured for non-development environments',
      type: 'error' as const,
    },
  ];

  const activeRecommendations = securityRecommendations.filter(rec => rec.condition);

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {getStatusIcon()}
            Configuration Validation
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration Score */}
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Configuration Score:</span>
            <span className={`text-xl font-bold ${getScoreColor(configScore)}`}>
              {configScore}%
            </span>
          </div>

          {/* Error Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-gray-300">Errors:</span>
              <Badge variant={validation.errors.length > 0 ? "destructive" : "secondary"}>
                {validation.errors.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-300">Warnings:</span>
              <Badge variant={validation.warnings.length > 0 ? "default" : "secondary"}>
                {validation.warnings.length}
              </Badge>
            </div>
          </div>

          {/* Validation Messages */}
          {validation.errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-red-400 font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Configuration Errors
              </h4>
              {validation.errors.map((error, index) => (
                <Alert key={index} className="bg-red-900/20 border-red-700">
                  <AlertDescription className="text-red-300">
                    <span className="font-medium">{getFieldLabel(error.field)}:</span> {error.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-yellow-400 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Configuration Warnings
              </h4>
              {validation.warnings.map((warning, index) => (
                <Alert key={index} className="bg-yellow-900/20 border-yellow-700">
                  <AlertDescription className="text-yellow-300">
                    <span className="font-medium">{getFieldLabel(warning.field)}:</span> {warning.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Security Recommendations */}
          {activeRecommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-blue-400 font-medium flex items-center gap-2">
                <Info className="w-4 h-4" />
                Security Recommendations
              </h4>
              {activeRecommendations.map((rec, index) => (
                <Alert 
                  key={index} 
                  className={`${
                    rec.type === 'error' ? 'bg-red-900/20 border-red-700' :
                    rec.type === 'warning' ? 'bg-yellow-900/20 border-yellow-700' :
                    'bg-blue-900/20 border-blue-700'
                  }`}
                >
                  <AlertDescription className={`${
                    rec.type === 'error' ? 'text-red-300' :
                    rec.type === 'warning' ? 'text-yellow-300' :
                    'text-blue-300'
                  }`}>
                    {rec.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Success Message */}
          {validation.valid && validation.warnings.length === 0 && activeRecommendations.length === 0 && (
            <Alert className="bg-green-900/20 border-green-700">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <AlertDescription className="text-green-300">
                Configuration is valid and follows all security best practices.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default EnterpriseConfigValidationComponent; 