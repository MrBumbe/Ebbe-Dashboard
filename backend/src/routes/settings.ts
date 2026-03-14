import { Router, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../db';
import { settings } from '../db/schema';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// GET /api/v1/settings — get all settings for the family as a key/value map
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const familyId = req.user!.familyId;

  const rows = db.select().from(settings)
    .where(eq(settings.familyId, familyId))
    .all();

  // Return as a flat object: { "mood.active": [...], "theme": "light", ... }
  const map: Record<string, unknown> = {};
  for (const row of rows) {
    try {
      map[row.key] = JSON.parse(row.value);
    } catch {
      map[row.key] = row.value;
    }
  }

  res.json({ data: map });
});

// GET /api/v1/settings/:key — get a single setting
router.get('/:key', (req: AuthRequest, res: Response) => {
  const { key } = req.params;
  const familyId = req.user!.familyId;
  const db = getDb();

  const row = db.select().from(settings)
    .where(and(eq(settings.familyId, familyId), eq(settings.key, key)))
    .get();

  if (!row) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Setting '${key}' not found` } });
    return;
  }

  let value: unknown;
  try {
    value = JSON.parse(row.value);
  } catch {
    value = row.value;
  }

  res.json({ data: { key, value } });
});

// PUT /api/v1/settings/:key — upsert a setting (admin/parent only)
router.put('/:key', requireRole('admin', 'parent'), (req: AuthRequest, res: Response) => {
  const { key } = req.params;
  const { value } = req.body as { value?: unknown };
  const familyId = req.user!.familyId;

  if (value === undefined) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'value is required' } });
    return;
  }

  const db = getDb();
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);

  // SQLite upsert via insert + onConflictDoUpdate
  db.insert(settings)
    .values({ familyId, key, value: serialized })
    .onConflictDoUpdate({
      target: [settings.familyId, settings.key],
      set: { value: serialized },
    })
    .run();

  res.json({ data: { key, value } });
});

// DELETE /api/v1/settings/:key — remove a setting (admin only)
router.delete('/:key', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const { key } = req.params;
  const familyId = req.user!.familyId;
  const db = getDb();

  db.delete(settings)
    .where(and(eq(settings.familyId, familyId), eq(settings.key, key)))
    .run();

  res.status(204).send();
});

export default router;
