import 'dotenv/config';

function required(key) {
  const v = process.env[key];
  if (!v || v.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return v;
}

function optional(key, fallback) {
  const v = process.env[key];
  return v && v.trim() !== '' ? v : fallback;
}

const isProd = process.env.NODE_ENV === 'production';

const config = {
  env: process.env.NODE_ENV ?? 'development',
  isProd,
  port: Number(optional('PORT', 3000)),

  db: {
    url: required('DATABASE_URL'),
    poolMax: Number(optional('DB_POOL_MAX', 10)),
    idleTimeoutMillis: Number(optional('DB_IDLE_TIMEOUT_MS', 30_000)),
    connectionTimeoutMillis: Number(optional('DB_CONNECT_TIMEOUT_MS', 5_000)),
  },

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: optional('JWT_EXPIRES_IN', '7d'),
    cookieName: optional('JWT_COOKIE_NAME', 'org_token'),
    cookieMaxAgeMs: Number(optional('JWT_COOKIE_MAX_AGE_MS', 7 * 24 * 60 * 60 * 1000)),
  },

  cors: {
    origins: optional('CLIENT_ORIGIN', 'http://localhost:5174', 'http://localhost:3000')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },

  bcrypt: {
    rounds: Number(optional('BCRYPT_ROUNDS', 12)),
  },
};

// Guardrails — fail fast on bad config
if (config.jwt.secret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}
if (isProd) {
  if (config.jwt.secret.includes('change-me')) {
    throw new Error('Refusing to boot in production with a placeholder JWT_SECRET');
  }
  if (config.cors.origins.some((o) => o.startsWith('http://'))) {
    throw new Error('Production CORS origins must use HTTPS');
  }
}

export default Object.freeze(config);