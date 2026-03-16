import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { families } from '../db/schema';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/v1/family — get family info
router.get('/', requireAuth, (req: AuthRequest, res) => {
  const db = getDb();
  const family = db.select({ id: families.id, name: families.name })
    .from(families).where(eq(families.id, req.user!.familyId)).get();
  if (!family) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Family not found' } });
    return;
  }
  res.json({ data: family });
});

// PATCH /api/v1/family — admin only, update family name
router.patch('/', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
  const { name } = req.body as { name?: string };
  if (!name || !name.trim()) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'name is required' } });
    return;
  }
  const db = getDb();
  db.update(families).set({ name: name.trim() })
    .where(eq(families.id, req.user!.familyId)).run();
  res.json({ data: { ok: true } });
});

export default router;
