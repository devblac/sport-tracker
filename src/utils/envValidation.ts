/**
 * Environment Variable Validation
 * Ensures required environment variables are present and valid
 */

import { z } from 'zod';

// Environment schema with comprehensive validation
const EnvSchema = z.object({
  VITE_SUPABASE_URL: z.string()
    .url('Invalid Supabase URL')
    .refine(url => url.includes('supabase.co') || url.includes('localhost'), 
      'Supabase URL must be from supabase.co or localhost'),
  VITE_SUPABASE_ANON_KEY: z.string()
    .min(1, 'Supabase anon key is required')
    .refine(key => key.startsWith('eyJ'), 'Invalid Supabase anon key format'),
  VITE_STRIPE_PUBLIC_KEY: z.string()
    .optional()
    .refine(key => !key || key.startsWith('pk_'), 'Stripe public key must start with pk_'),
  MODE: z.enum(['development', 'production', 'test']),
  VITE_APP_VERSION: z.string().optional(),
  VITE_SENTRY_DSN: z.string().url().optional().or(z.literal('')),
});

// Security patterns to detect leaked secrets
const SECRET_PATTERNS = [
  { pattern: /sk_[a-zA-Z0-9_]+/, name: 'Stripe Secret Key' },
  { pattern: /rk_[a-zA-Z0-9_]+/, name: 'Stripe Restricted Key' },
  { pattern: /service_role_[a-zA-Z0-9_]+/, name: 'Supabase Service Role Key' },
  { pattern: /-----BEGIN [A-Z ]+-----/, name: 'Private Key' },
  { pattern: /AKIA[0-9A-Z]{16}/, name: 'AWS Access Key' },
  { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub Personal Access Token' },
] as const;

interface ValidationResult {
  success: boolean;
  env?: z.infer<typeof EnvSchema>;
  error?: string | Error;
  warnings?: string[];
}

export const validateEnvironment = (): ValidationResult => {
  try {
    const env = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_STRIPE_PUBLIC_KEY: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
      MODE: import.meta.env.MODE,
      VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
      VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    };

    // Validate schema
    const validatedEnv = EnvSchema.parse(env);
    
    // Security checks for leaked secrets
    const warnings: string[] = [];
    const allEnvValues = Object.values(import.meta.env).join(' ');
    
    for (const { pattern, name } of SECRET_PATTERNS) {
      if (pattern.test(allEnvValues)) {
        const error = `SECURITY ERROR: ${name} detected in environment variables`;
        console.error(error);
        return { success: false, error };
      }
    }
    
    // Production-specific validations
    if (validatedEnv.MODE === 'production') {
      if (!validatedEnv.VITE_SUPABASE_URL.startsWith('https://')) {
        return { 
          success: false, 
          error: 'Production Supabase URL must use HTTPS' 
        };
      }
      
      if (validatedEnv.VITE_SUPABASE_URL.includes('localhost')) {
        warnings.push('Using localhost Supabase URL in production mode');
      }
    }
    
    // Development warnings
    if (validatedEnv.MODE === 'development') {
      if (!validatedEnv.VITE_STRIPE_PUBLIC_KEY) {
        warnings.push('Stripe public key not configured - payment features will be disabled');
      }
    }
    
    return { 
      success: true, 
      env: validatedEnv,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Environment validation failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Safe environment getter with fallbacks
export const getEnvVar = (key: string, fallback?: string): string => {
  const value = import.meta.env[key];
  if (!value && !fallback) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value || fallback || '';
};

// Check if running in development
export const isDevelopment = (): boolean => {
  return import.meta.env.MODE === 'development';
};

// Check if running in production
export const isProduction = (): boolean => {
  return import.meta.env.MODE === 'production';
};

// Validate on module load with better error handling
let validationResult: ValidationResult;
try {
  validationResult = validateEnvironment();
  
  if (!validationResult.success) {
    throw new Error(`Environment validation failed: ${validationResult.error}`);
  }
  
  if (validationResult.warnings) {
    validationResult.warnings.forEach(warning => {
      console.warn(`Environment warning: ${warning}`);
    });
  }
} catch (error) {
  console.error('Critical environment validation error:', error);
  throw error;
}

export const validatedEnv = validationResult.env!;