import { Router, Response } from 'express';
import { eq, and, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { events } from '../db/schema';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /api/v1/events
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const rows = db.select().from(events)
    .where(eq(events.familyId, req.user!.familyId))
    .orderBy(asc(events.eventDate))
    .all();
  res.json({ data: rows });
});

// POST /api/v1/events
router.post('/', requireRole('admin', 'parent'), (req: AuthRequest, res: Response) => {
  const { title, emoji, eventDate, isVisible } = req.body as {
    title?: string; emoji?: string; eventDate?: number; isVisible?: boolean;
  };
  const familyId = req.user!.familyId;

  if (!title || eventDate === undefined) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'title and eventDate are required' } });
    return;
  }

  const db = getDb();
  const id = randomUUID();
  db.insert(events).values({
    id, familyId, title,
    emoji: emoji ?? '🎉',
    eventDate,
    isVisible: isVisible ?? true,
  }).run();

  const created = db.select().from(events).where(eq(events.id, id)).get();
  res.status(201).json({ data: created });
});

// PATCH /api/v1/events/:id
router.patch('/:id', requireRole('admin', 'parent'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const familyId = req.user!.familyId;
  const db = getDb();

  const existing = db.select().from(events)
    .where(and(eq(events.id, id), eq(events.familyId, familyId))).get();
  if (!existing) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Event not found' } });
    return;
  }

  const { title, emoji, eventDate, isVisible } = req.body as {
    title?: string; emoji?: string; eventDate?: number; isVisible?: boolean;
  };

  db.update(events).set({
    ...(title !== undefined && { title }),
    ...(emoji !== undefined && { emoji }),
    ...(eventDate !== undefined && { eventDate }),
    ...(isVisible !== undefined && { isVisible }),
  }).where(and(eq(events.id, id), eq(events.familyId, familyId))).run();

  res.json({ data: db.select().from(events).where(eq(events.id, id)).get() });
});

// DELETE /api/v1/events/:id
router.delete('/:id', requireRole('admin', 'parent'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const familyId = req.user!.familyId;
  const db = getDb();

  const existing = db.select().from(events)
    .where(and(eq(events.id, id), eq(events.familyId, familyId))).get();
  if (!existing) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Event not found' } });
    return;
  }

  db.delete(events).where(and(eq(events.id, id), eq(events.familyId, familyId))).run();
  res.status(204).send();
});

export default router;
