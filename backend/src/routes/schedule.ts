import { Router, Response } from 'express';
import { eq, and, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { scheduleItems } from '../db/schema';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// GET /api/v1/schedule — list all schedule items, ordered by day then time
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const familyId = req.user!.familyId;

  const rows = db.select().from(scheduleItems)
    .where(eq(scheduleItems.familyId, familyId))
    .orderBy(asc(scheduleItems.dayOfWeek), asc(scheduleItems.timeStart))
    .all();

  res.json({ data: rows });
});

// POST /api/v1/schedule — create a schedule item
router.post('/', requireRole('admin', 'parent'), (req: AuthRequest, res: Response) => {
  const { dayOfWeek, timeStart, title, emoji, color } = req.body as {
    dayOfWeek?: number;
    timeStart?: string;
    title?: string;
    emoji?: string;
    color?: string;
  };
  const familyId = req.user!.familyId;

  if (dayOfWeek === undefined || !timeStart || !title) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'dayOfWeek, timeStart, and title are required' } });
    return;
  }
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    res.status(400).json({ error: { code: 'INVALID_DAY', message: 'dayOfWeek must be 0 (Mon) through 6 (Sun)' } });
    return;
  }
  if (!/^\d{2}:\d{2}$/.test(timeStart)) {
    res.status(400).json({ error: { code: 'INVALID_TIME', message: 'timeStart must be HH:MM format' } });
    return;
  }

  const db = getDb();
  const id = randomUUID();

  db.insert(scheduleItems).values({
    id,
    familyId,
    dayOfWeek,
    timeStart,
    title,
    emoji: emoji ?? '📅',
    color: color ?? '#4A90D9',
  }).run();

  const created = db.select().from(scheduleItems).where(eq(scheduleItems.id, id)).get();
  res.status(201).json({ data: created });
});

// PATCH /api/v1/schedule/:id — update a schedule item
router.patch('/:id', requireRole('admin', 'parent'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const familyId = req.user!.familyId;
  const db = getDb();

  const existing = db.select().from(scheduleItems)
    .where(and(eq(scheduleItems.id, id), eq(scheduleItems.familyId, familyId)))
    .get();

  if (!existing) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Schedule item not found' } });
    return;
  }

  const { dayOfWeek, timeStart, title, emoji, color } = req.body as {
    dayOfWeek?: number;
    timeStart?: string;
    title?: string;
    emoji?: string;
    color?: string;
  };

  if (dayOfWeek !== undefined && (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6)) {
    res.status(400).json({ error: { code: 'INVALID_DAY', message: 'dayOfWeek must be 0 (Mon) through 6 (Sun)' } });
    return;
  }
  if (timeStart !== undefined && !/^\d{2}:\d{2}$/.test(timeStart)) {
    res.status(400).json({ error: { code: 'INVALID_TIME', message: 'timeStart must be HH:MM format' } });
    return;
  }

  db.update(scheduleItems)
    .set({
      ...(dayOfWeek !== undefined && { dayOfWeek }),
      ...(timeStart !== undefined && { timeStart }),
      ...(title !== undefined && { title }),
      ...(emoji !== undefined && { emoji }),
      ...(color !== undefined && { color }),
    })
    .where(and(eq(scheduleItems.id, id), eq(scheduleItems.familyId, familyId)))
    .run();

  const updated = db.select().from(scheduleItems).where(eq(scheduleItems.id, id)).get();
  res.json({ data: updated });
});

// DELETE /api/v1/schedule/:id — delete a schedule item
router.delete('/:id', requireRole('admin', 'parent'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const familyId = req.user!.familyId;
  const db = getDb();

  const existing = db.select().from(scheduleItems)
    .where(and(eq(scheduleItems.id, id), eq(scheduleItems.familyId, familyId)))
    .get();

  if (!existing) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Schedule item not found' } });
    return;
  }

  db.delete(scheduleItems).where(and(eq(scheduleItems.id, id), eq(scheduleItems.familyId, familyId))).run();
  res.status(204).send();
});

export default router;
