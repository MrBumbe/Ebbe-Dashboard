import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { config } from '../config';
import * as schema from './schema';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function initDb() {
  mkdirSync(dirname(config.databasePath), { recursive: true });
  const sqlite = new Database(config.databasePath);

  // Performance settings for SQLite
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('synchronous = NORMAL');

  const db = drizzle(sqlite, { schema });

  // Auto-run migrations on every startup — idempotent, safe in production
  const migrationsFolder = resolve(__dirname, 'migrations');
  migrate(db, { migrationsFolder });

  _db = db;
  console.log(`Database ready at ${config.databasePath}`);
  return _db;
}

export function getDb() {
  if (!_db) throw new Error('Database not initialised. Call initDb() first.');
  return _db;
}
