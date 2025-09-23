// DEPRECATED: Use secureEnv.ts for secure environment configuration
// This file is maintained for backward compatibility only

import {
  validateSecureEnvironment,
  getSecureEnvConfig,
  requireSecureEnvVar,
  type SecureEnvConfig
} from './secureEnv';

// Re-export the secure environment functions
export const validateEnv = validateSecureEnvironment;
export const getEnvConfig = getSecureEnvConfig;
export const requireEnvVar = requireSecureEnvVar;
export type EnvConfig = SecureEnvConfig;

// Backward compatibility warning
console.warn('⚠️  Using deprecated env.ts - migrate to secureEnv.ts for enhanced security');

// Ensure secure validation is used
validateSecureEnvironment();
