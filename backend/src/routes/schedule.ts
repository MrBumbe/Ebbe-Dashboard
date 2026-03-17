import { Router, Response } from 'express';
import { eq, and, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { scheduleItems } from '../db/schema';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { jsToEbbeDay } from '../lib/scheduleDate';

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
  const { dayOfWeek, timeStart, title, emoji, color, isRecurring, specificDate, childId } = req.body as {
    dayOfWeek?: number;
    timeStart?: string;
    title?: string;
    emoji?: string;
    color?: string;
    isRecurring?: boolean;
    specificDate?: number | null;
    childId?: string | null;
  };
  const familyId = req.user!.familyId;

  if (!timeStart || !title) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'timeStart and title are required' } });
    return;
  }
  if (!/^\d{2}:\d{2}$/.test(timeStart)) {
    res.status(400).json({ error: { code: 'INVALID_TIME', message: 'timeStart must be HH:MM format' } });
    return;
  }

  const recurring = isRecurring !== false; // default true

  // Compute effective dayOfWeek
  let effectiveDayOfWeek: number;
  if (!recurring && specificDate) {
    // One-time: derive dayOfWeek from the specific date
    effectiveDayOfWeek = jsToEbbeDay(new Date(specificDate).getDay());
  } else if (recurring && specificDate) {
    // Annual: derive from the anchor date in current year
    const anchor = new Date(specificDate);
    const thisYear = new Date().getFullYear();
    const occurrence = new Date(thisYear, anchor.getMonth(), anchor.getDate());
    effectiveDayOfWeek = jsToEbbeDay(occurrence.getDay());
  } else {
    // Pure weekly: dayOfWeek is required
    if (dayOfWeek === undefined) {
      res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'dayOfWeek is required when no specificDate is set' } });
      return;
    }
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      res.status(400).json({ error: { code: 'INVALID_DAY', message: 'dayOfWeek must be 0 (Mon) through 6 (Sun)' } });
      return;
    }
    effectiveDayOfWeek = dayOfWeek;
  }

  const db = getDb();
  const id = randomUUID();

  db.insert(scheduleItems).values({
    id,
    familyId,
    childId: childId ?? null,
    dayOfWeek: effectiveDayOfWeek,
    timeStart,
    title,
    emoji: emoji ?? '📅',
    color: color ?? '#4A90D9',
    isRecurring: recurring,
    specificDate: specificDate ?? null,
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

  const { dayOfWeek, timeStart, title, emoji, color, isRecurring, specificDate, childId } = req.body as {
    dayOfWeek?: number;
    timeStart?: string;
    title?: string;
    emoji?: string;
    color?: string;
    isRecurring?: boolean;
    specificDate?: number | null;
    childId?: string | null;
  };

  if (timeStart !== undefined && !/^\d{2}:\d{2}$/.test(timeStart)) {
    res.status(400).json({ error: { code: 'INVALID_TIME', message: 'timeStart must be HH:MM format' } });
    return;
  }

  // Re-compute dayOfWeek if isRecurring or specificDate changed
  const newRecurring = isRecurring !== undefined ? isRecurring : existing.isRecurring;
  const newSpecificDate = specificDate !== undefined ? specificDate : existing.specificDate;

  let newDayOfWeek: number | undefined;
  if (isRecurring !== undefined || specificDate !== undefined) {
    if (!newRecurring && newSpecificDate) {
      newDayOfWeek = jsToEbbeDay(new Date(newSpecificDate).getDay());
    } else if (newRecurring && newSpecificDate) {
      const anchor = new Date(newSpecificDate);
      const thisYear = new Date().getFullYear();
      const occurrence = new Date(thisYear, anchor.getMonth(), anchor.getDate());
      newDayOfWeek = jsToEbbeDay(occurrence.getDay());
    } else if (dayOfWeek !== undefined) {
      newDayOfWeek = dayOfWeek;
    }
  } else if (dayOfWeek !== undefined) {
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      res.status(400).json({ error: { code: 'INVALID_DAY', message: 'dayOfWeek must be 0 (Mon) through 6 (Sun)' } });
      return;
    }
    newDayOfWeek = dayOfWeek;
  }

  db.update(scheduleItems)
    .set({
      ...(newDayOfWeek !== undefined && { dayOfWeek: newDayOfWeek }),
      ...(timeStart !== undefined && { timeStart }),
      ...(title !== undefined && { title }),
      ...(emoji !== undefined && { emoji }),
      ...(color !== undefined && { color }),
      ...(isRecurring !== undefined && { isRecurring }),
      ...(specificDate !== undefined && { specificDate }),
      ...(childId !== undefined && { childId: childId ?? null }),
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
