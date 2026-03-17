export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databasePath: process.env.DATABASE_PATH ?? './data/ebbe.db',
  // JWT secrets are loaded by lib/secrets.ts (from env vars or auto-generated in DB)
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  jwtExpiresIn: '15m',
  jwtRefreshExpiresIn: '30d',
} as const;
