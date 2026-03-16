import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { scryptSync, timingSafeEqual } from 'crypto';
import { getDb } from '../db';
import { users } from '../db/schema';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';


const router = Router();

// POST /api/v1/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: { code: 'MISSING_CREDENTIALS', message: 'email and password are required' } });
    return;
  }

  const db = getDb();
  const user = db.select().from(users).where(eq(users.email, email)).get();

  if (!user) {
    res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    return;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    return;
  }

  const payload = {
    userId: user.id,
    familyId: user.familyId,
    role: user.role,
    name: user.name,
    mustChangePassword: user.mustChangePassword,
  };
  res.json({
    data: {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    },
  });
});

// POST /api/v1/auth/refresh
router.post('/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };

  if (!refreshToken) {
    res.status(400).json({ error: { code: 'MISSING_TOKEN', message: 'refreshToken is required' } });
    return;
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' } });
    return;
  }

  // Confirm user still exists
  const db = getDb();
  const user = db.select().from(users).where(eq(users.id, payload.userId)).get();

  if (!user) {
    res.status(401).json({ error: { code: 'USER_NOT_FOUND', message: 'User no longer exists' } });
    return;
  }

  const newPayload = {
    userId: user.id,
    familyId: user.familyId,
    role: user.role,
    name: user.name,
    mustChangePassword: user.mustChangePassword,
  };
  res.json({
    data: {
      accessToken: signAccessToken(newPayload),
    },
  });
});

/**
 * Verifies a password against a stored hash.
 * Hash format: "<salt_hex>:<hash_hex>" (scrypt, N=16384, r=8, p=1, keylen=64)
 */
function verifyPassword(password: string, storedHash: string): boolean {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = scryptSync(password, salt, 64);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export default router;
