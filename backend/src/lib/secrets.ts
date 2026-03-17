/**
 * JWT secret management.
 *
 * Priority order:
 *   1. JWT_SECRET / JWT_REFRESH_SECRET environment variables (explicit config)
 *   2. Values stored in the `secrets` table in the SQLite database (auto-generated on first run)
 *
 * Call loadSecrets(dbPath) once at startup before any JWT operations.
 * After that, getJwtSecret() and getJwtRefreshSecret() return the active values.
 */
import Database from 'better-sqlite3';
import { randomBytes } from 'crypto';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

let _jwtSecret = process.env.JWT_SECRET ?? '';
let _jwtRefreshSecret = process.env.JWT_REFRESH_SECRET ?? '';

export function loadSecrets(dbPath: string): void {
  // Both provided via environment — nothing to do
  if (_jwtSecret && _jwtRefreshSecret) return;

  // Open a raw connection to the same DB file (Drizzle will open its own later)
  mkdirSync(dirname(dbPath) || '.', { recursive: true });
  const db = new Database(dbPath);

  try {
    db.exec(
      `CREATE TABLE IF NOT EXISTS secrets (
         key   TEXT PRIMARY KEY,
         value TEXT NOT NULL
       )`
    );

    const jwtRow     = db.prepare('SELECT value FROM secrets WHERE key = ?').get('jwt_secret')         as { value: string } | undefined;
    const refreshRow = db.prepare('SELECT value FROM secrets WHERE key = ?').get('jwt_refresh_secret') as { value: string } | undefined;

    _jwtSecret        = _jwtSecret        || jwtRow?.value     || '';
    _jwtRefreshSecret = _jwtRefreshSecret || refreshRow?.value || '';

    if (!_jwtSecret || !_jwtRefreshSecret) {
      // Generate whatever is still missing
      if (!_jwtSecret)        _jwtSecret        = randomBytes(32).toString('hex');
      if (!_jwtRefreshSecret) _jwtRefreshSecret = randomBytes(32).toString('hex');

      db.prepare('INSERT OR REPLACE INTO secrets (key, value) VALUES (?, ?)').run('jwt_secret',         _jwtSecret);
      db.prepare('INSERT OR REPLACE INTO secrets (key, value) VALUES (?, ?)').run('jwt_refresh_secret', _jwtRefreshSecret);

      console.log('Generated JWT secrets and stored them in the database.');
      console.log('(Set JWT_SECRET and JWT_REFRESH_SECRET in .env to use your own fixed values.)');
    }
  } finally {
    db.close();
  }
}

export function getJwtSecret(): string {
  if (!_jwtSecret) throw new Error('JWT secrets not loaded — call loadSecrets() before starting the server.');
  return _jwtSecret;
}

export function getJwtRefreshSecret(): string {
  if (!_jwtRefreshSecret) throw new Error('JWT secrets not loaded — call loadSecrets() before starting the server.');
  return _jwtRefreshSecret;
}
