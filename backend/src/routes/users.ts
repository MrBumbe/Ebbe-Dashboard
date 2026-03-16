import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { randomUUID, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { getDb } from '../db';
import { users, inviteTokens } from '../db/schema';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { signAccessToken, signRefreshToken } from '../lib/jwt';

const router = Router();

// ── Helpers ─────────────────────────────────────────────────────────────────

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

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

// ── Routes ──────────────────────────────────────────────────────────────────

// GET /api/v1/users — admin only, list all family members
router.get('/', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
  const db = getDb();
  const all = db.select({
    id:                 users.id,
    name:               users.name,
    email:              users.email,
    phone:              users.phone,
    role:               users.role,
    roleTitle:          users.roleTitle,
    mustChangePassword: users.mustChangePassword,
    createdAt:          users.createdAt,
  }).from(users).where(eq(users.familyId, req.user!.familyId)).all();
  res.json({ data: all });
});

// GET /api/v1/users/me — authenticated, get current user profile
router.get('/me', requireAuth, (req: AuthRequest, res) => {
  const db = getDb();
  const user = db.select({
    id:                 users.id,
    name:               users.name,
    email:              users.email,
    phone:              users.phone,
    role:               users.role,
    roleTitle:          users.roleTitle,
    mustChangePassword: users.mustChangePassword,
    createdAt:          users.createdAt,
  }).from(users).where(eq(users.id, req.user!.userId)).get();
  if (!user) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    return;
  }
  res.json({ data: user });
});

// POST /api/v1/users/invite — admin only, generate a 24h invite link
router.post('/invite', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
  const { role } = req.body as { role?: string };
  if (!role || !['admin', 'parent'].includes(role)) {
    res.status(400).json({ error: { code: 'INVALID_ROLE', message: 'role must be admin or parent' } });
    return;
  }
  const db = getDb();
  const token = randomBytes(24).toString('hex');
  const now = Date.now();
  const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours
  db.insert(inviteTokens).values({
    id: randomUUID(),
    familyId: req.user!.familyId,
    token,
    role,
    createdBy: req.user!.userId,
    expiresAt,
    createdAt: now,
  }).run();
  res.json({ data: { token, inviteUrl: `/parent/join?token=${token}`, expiresAt } });
});

// POST /api/v1/users/join — public, create account from invite token
router.post('/join', (req, res) => {
  const { token, name, email, password, phone } = req.body as {
    token?: string;
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
  };
  if (!token || !name || !email || !password) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'token, name, email, password are required' } });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' } });
    return;
  }
  const db = getDb();
  const invite = db.select().from(inviteTokens).where(eq(inviteTokens.token, token)).get();
  if (!invite) {
    res.status(400).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid invite token' } });
    return;
  }
  if (invite.usedAt) {
    res.status(400).json({ error: { code: 'TOKEN_USED', message: 'This invite link has already been used' } });
    return;
  }
  if (invite.expiresAt < Date.now()) {
    res.status(400).json({ error: { code: 'TOKEN_EXPIRED', message: 'This invite link has expired' } });
    return;
  }
  const existing = db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists' } });
    return;
  }
  const now = Date.now();
  const userId = randomUUID();
  db.insert(users).values({
    id: userId,
    familyId: invite.familyId,
    name,
    email,
    passwordHash: hashPassword(password),
    role: invite.role as 'admin' | 'parent' | 'readonly',
    phone: phone ?? null,
    createdAt: now,
  }).run();
  db.update(inviteTokens).set({ usedAt: now }).where(eq(inviteTokens.id, invite.id)).run();
  const user = db.select().from(users).where(eq(users.id, userId)).get()!;
  const payload = {
    userId: user.id,
    familyId: user.familyId,
    role: user.role,
    name: user.name,
    mustChangePassword: user.mustChangePassword,
  };
  res.status(201).json({
    data: {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    },
  });
});

// PATCH /api/v1/users/me/password — change own password
router.patch('/me/password', requireAuth, (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'currentPassword and newPassword are required' } });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' } });
    return;
  }
  const db = getDb();
  const user = db.select().from(users).where(eq(users.id, req.user!.userId)).get();
  if (!user) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    return;
  }
  if (!verifyPassword(currentPassword, user.passwordHash)) {
    res.status(401).json({ error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' } });
    return;
  }
  db.update(users).set({
    passwordHash: hashPassword(newPassword),
    mustChangePassword: false,
  }).where(eq(users.id, user.id)).run();
  res.json({ data: { ok: true } });
});

// PATCH /api/v1/users/me/profile — update own name and phone
router.patch('/me/profile', requireAuth, (req: AuthRequest, res) => {
  const { name, phone } = req.body as { name?: string; phone?: string };
  const db = getDb();
  db.update(users).set({
    ...(name !== undefined && { name }),
    ...(phone !== undefined && { phone }),
  }).where(eq(users.id, req.user!.userId)).run();
  res.json({ data: { ok: true } });
});

// PATCH /api/v1/users/:id — admin updates any user
router.patch('/:id', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, role, roleTitle, phone } = req.body as {
    name?: string;
    role?: string;
    roleTitle?: string;
    phone?: string;
  };
  if (role !== undefined && !['admin', 'parent'].includes(role)) {
    res.status(400).json({ error: { code: 'INVALID_ROLE', message: 'role must be admin or parent' } });
    return;
  }
  const db = getDb();
  const target = db.select().from(users)
    .where(and(eq(users.id, id), eq(users.familyId, req.user!.familyId))).get();
  if (!target) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    return;
  }
  db.update(users).set({
    ...(name !== undefined && { name }),
    ...(role !== undefined && { role: role as 'admin' | 'parent' | 'readonly' }),
    ...(roleTitle !== undefined && { roleTitle }),
    ...(phone !== undefined && { phone }),
  }).where(eq(users.id, id)).run();
  res.json({ data: { ok: true } });
});

// DELETE /api/v1/users/:id — admin only, cannot delete self
router.delete('/:id', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
  const { id } = req.params;
  if (id === req.user!.userId) {
    res.status(400).json({ error: { code: 'CANNOT_DELETE_SELF', message: 'You cannot delete your own account' } });
    return;
  }
  const db = getDb();
  const target = db.select().from(users)
    .where(and(eq(users.id, id), eq(users.familyId, req.user!.familyId))).get();
  if (!target) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    return;
  }
  db.delete(users).where(eq(users.id, id)).run();
  res.json({ data: { ok: true } });
});

// POST /api/v1/users/:id/reset-password — admin only, sets temp password
router.post('/:id/reset-password', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const db = getDb();
  const target = db.select().from(users)
    .where(and(eq(users.id, id), eq(users.familyId, req.user!.familyId))).get();
  if (!target) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    return;
  }
  const tempPassword = randomBytes(6).toString('hex'); // 12 hex chars
  db.update(users).set({
    passwordHash: hashPassword(tempPassword),
    mustChangePassword: true,
  }).where(eq(users.id, id)).run();
  res.json({ data: { tempPassword } });
});

export default router;
