import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { randomUUID, randomBytes } from 'crypto';
import { getDb } from '../db';
import { children } from '../db/schema';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/v1/children — list all children for the family
router.get('/', requireAuth, (req: AuthRequest, res) => {
  const db = getDb();
  const all = db.select().from(children)
    .where(eq(children.familyId, req.user!.familyId)).all();
  res.json({ data: all });
});

// POST /api/v1/children — add a new child
router.post('/', requireAuth, (req: AuthRequest, res) => {
  const { name, emoji, color, birthdate } = req.body as {
    name?: string;
    emoji?: string;
    color?: string;
    birthdate?: number | null;
  };
  if (!name || !name.trim()) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'name is required' } });
    return;
  }
  const db = getDb();
  const childToken = randomBytes(24).toString('hex');
  const id = randomUUID();
  db.insert(children).values({
    id,
    familyId: req.user!.familyId,
    name: name.trim(),
    emoji: emoji ?? '🧒',
    color: color ?? '#1565C0',
    birthdate: birthdate ?? null,
    childToken,
    createdAt: Date.now(),
  }).run();
  const child = db.select().from(children).where(eq(children.id, id)).get();
  res.status(201).json({ data: child });
});

// PATCH /api/v1/children/:id — update child
router.patch('/:id', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, emoji, color, birthdate } = req.body as {
    name?: string;
    emoji?: string;
    color?: string;
    birthdate?: number | null;
  };
  const db = getDb();
  const child = db.select().from(children)
    .where(and(eq(children.id, id), eq(children.familyId, req.user!.familyId))).get();
  if (!child) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Child not found' } });
    return;
  }
  db.update(children).set({
    ...(name !== undefined && { name: name.trim() }),
    ...(emoji !== undefined && { emoji }),
    ...(color !== undefined && { color }),
    ...(birthdate !== undefined && { birthdate }),
  }).where(eq(children.id, id)).run();
  const updated = db.select().from(children).where(eq(children.id, id)).get();
  res.json({ data: updated });
});

// DELETE /api/v1/children/:id — remove a child
router.delete('/:id', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const db = getDb();
  const child = db.select().from(children)
    .where(and(eq(children.id, id), eq(children.familyId, req.user!.familyId))).get();
  if (!child) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Child not found' } });
    return;
  }
  db.delete(children).where(eq(children.id, id)).run();
  res.json({ data: { ok: true } });
});

export default router;
