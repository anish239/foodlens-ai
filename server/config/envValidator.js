/**
 * FoodLens AI - Centralized Environment Validator
 * 
 * Validates environment variables at application startup.
 * Enforces production security rules:
 * - Fails fast if critical secrets are missing in production.
 * - Prevents default/trivial secrets in production.
 * - Provides safe getters and diagnostics without exposing secrets.
 */

export const validateEnvironment = (env = process.env) => {
  const isProduction = env.NODE_ENV === 'production';
  const errors = [];
  const warnings = [];

  // 1. Port Validation
  const port = parseInt(env.PORT || '5000', 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    errors.push(`Invalid PORT configuration: "${env.PORT}". Must be between 1 and 65535.`);
  }

  // 2. MongoDB URI Validation
  const mongoUri = env.MONGODB_URI;
  if (!mongoUri) {
    if (isProduction) {
      errors.push('MONGODB_URI is required in production environment.');
    } else {
      warnings.push('MONGODB_URI is not defined. Local database operations will fail unless provided.');
    }
  } else if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    errors.push('MONGODB_URI must start with "mongodb://" or "mongodb+srv://".');
  }

  // 3. JWT Secret Hardening
  const jwtSecret = env.JWT_SECRET;
  const INSECURE_DEFAULTS = [
    'secret',
    'default',
    '123456',
    'default_jwt_secret_key',
    'development-secret',
    'replace_with_a_secure_secret',
    'replace-with-a-long-random-secret',
  ];

  if (isProduction) {
    if (!jwtSecret) {
      errors.push('JWT_SECRET is required in production environment.');
    } else if (INSECURE_DEFAULTS.includes(jwtSecret.toLowerCase()) || jwtSecret.length < 16) {
      errors.push('JWT_SECRET in production must be at least 16 characters long and cannot use default/trivial values.');
    }
  } else {
    if (!jwtSecret || INSECURE_DEFAULTS.includes(jwtSecret.toLowerCase())) {
      warnings.push('JWT_SECRET is using an insecure or default key for development/test mode.');
    }
  }

  // 4. Client URL Validation
  const clientUrl = env.CLIENT_URL;
  if (isProduction && !clientUrl) {
    warnings.push('CLIENT_URL is not set in production. CORS will default to strict origin checks.');
  }

  // 5. Gemini AI Key Validation
  const geminiApiKey = env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    warnings.push('GEMINI_API_KEY is not configured. AI explanation features will gracefully return 503 without crashing.');
  }

  // If there are fatal errors, throw or return
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    isProduction,
  };
};

export const getJwtSecret = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const secret = process.env.JWT_SECRET;

  if (isProduction) {
    if (!secret || secret.length < 16) {
      throw new Error('FATAL: JWT_SECRET is not configured or too short for production.');
    }
    return secret;
  }

  return secret || 'dev_fallback_foodlens_jwt_secret_key_2026';
};

export const getSanitizedEnvSummary = (env = process.env) => {
  return {
    nodeEnv: env.NODE_ENV || 'development',
    port: env.PORT || 5000,
    clientUrl: env.CLIENT_URL || '(same origin / default)',
    mongoConfigured: Boolean(env.MONGODB_URI),
    mongoProtocol: env.MONGODB_URI ? (env.MONGODB_URI.startsWith('mongodb+srv://') ? 'mongodb+srv' : 'mongodb') : 'none',
    jwtSecretConfigured: Boolean(env.JWT_SECRET),
    geminiApiKeyConfigured: Boolean(env.GEMINI_API_KEY),
    geminiModel: env.GEMINI_MODEL || 'gemini-3.8-flash',
    openFoodFactsBaseUrl: env.OPEN_FOOD_FACTS_BASE_URL || 'https://world.openfoodfacts.org/api/v2',
    secondaryProductApiKeyConfigured: Boolean(env.SECONDARY_PRODUCT_API_KEY || env.UPCITEMDB_API_KEY),
    usdaApiKeyConfigured: Boolean(env.USDA_API_KEY),
  };
};
