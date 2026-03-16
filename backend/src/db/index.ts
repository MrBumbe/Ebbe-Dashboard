import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { eq, isNull, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
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

  // ── Fixup 1: migrate legacy families.childToken into children table ──────
  // Runs once on first startup after the children table was added.
  const familyRows = db.select().from(schema.families).all();
  for (const family of familyRows) {
    const hasChildren = db.select().from(schema.children)
      .where(eq(schema.children.familyId, family.id)).get();
    if (!hasChildren && family.childToken) {
      db.insert(schema.children).values({
        id: randomUUID(),
        familyId: family.id,
        name: 'Child',
        emoji: '🧒',
        color: '#1565C0',
        birthdate: null,
        childToken: family.childToken,
        createdAt: Date.now(),
      }).run();
      console.log(`Migrated legacy child token for family ${family.id} into children table`);
    }
  }

  // ── Fixup 2: assign historical null-childId transactions to the sole child ─
  // For families with exactly one child, migrate existing task_completions and
  // reward_transactions (child_id = null) to reference that child. This preserves
  // historical star balances after the per-child data migration (0004).
  for (const family of familyRows) {
    const familyChildren = db.select().from(schema.children)
      .where(eq(schema.children.familyId, family.id)).all();
    if (familyChildren.length === 1) {
      const soleChildId = familyChildren[0].id;
      const txUpdated = db.update(schema.rewardTransactions)
        .set({ childId: soleChildId })
        .where(and(
          eq(schema.rewardTransactions.familyId, family.id),
          isNull(schema.rewardTransactions.childId),
        )).run();
      const compUpdated = db.update(schema.taskCompletions)
        .set({ childId: soleChildId })
        .where(and(
          eq(schema.taskCompletions.familyId, family.id),
          isNull(schema.taskCompletions.childId),
        )).run();
      if ((txUpdated.changes ?? 0) > 0 || (compUpdated.changes ?? 0) > 0) {
        console.log(`Migrated ${txUpdated.changes} transactions and ${compUpdated.changes} completions to child ${soleChildId}`);
      }
    }
  }

  _db = db;
  console.log(`Database ready at ${config.databasePath}`);
  return _db;
}

export function getDb() {
  if (!_db) throw new Error('Database not initialised. Call initDb() first.');
  return _db;
}
