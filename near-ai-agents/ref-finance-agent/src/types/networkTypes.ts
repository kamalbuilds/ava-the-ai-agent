/**
 * Network configuration interface extending the NearConfig
 */
import { NearConfig } from './index';

export interface NetworkConfig extends NearConfig {
  /**
   * Base URL for the Ref Finance API
   */
  refApiBaseUrl: string;
} 