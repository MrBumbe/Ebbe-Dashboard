function require_env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databasePath: process.env.DATABASE_PATH ?? './data/ebbe.db',
  jwtSecret: require_env('JWT_SECRET'),
  jwtRefreshSecret: require_env('JWT_REFRESH_SECRET'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  jwtExpiresIn: '15m',
  jwtRefreshExpiresIn: '30d',
} as const;
