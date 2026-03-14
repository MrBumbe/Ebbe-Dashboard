/**
 * Standalone migration runner — safe to call without JWT secrets.
 * Usage: tsx src/db/migrate.ts
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

const dbPath = process.env.DATABASE_PATH ?? './data/ebbe.db';
const migrationsFolder = resolve(__dirname, 'migrations');

mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite);

console.log(`Running migrations from ${migrationsFolder}`);
console.log(`Database: ${dbPath}`);

migrate(db, { migrationsFolder });

console.log('Migrations complete.');
sqlite.close();
