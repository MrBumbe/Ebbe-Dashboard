import { Router, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { moodLog } from '../db/schema';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

const VALID_MOODS = ['happy', 'okay', 'sad', 'angry', 'tired', 'excited', 'anxious'] as const;
type Mood = typeof VALID_MOODS[number];

// GET /api/v1/mood — list mood log (most recent first); optional ?childId= filter
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const familyId = req.user!.familyId;
  const childId = req.query.childId as string | undefined;

  const rows = db.select().from(moodLog)
    .where(and(
      eq(moodLog.familyId, familyId),
      ...(childId ? [eq(moodLog.childId, childId)] : []),
    ))
    .orderBy(desc(moodLog.loggedAt))
    .all();

  res.json({ data: rows });
});

// POST /api/v1/mood — log a mood check-in; optional childId in body
router.post('/', (req: AuthRequest, res: Response) => {
  const { mood, note, childId } = req.body as { mood?: string; note?: string; childId?: string };
  const familyId = req.user!.familyId;

  if (!mood) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'mood is required' } });
    return;
  }
  if (!VALID_MOODS.includes(mood as Mood)) {
    res.status(400).json({
      error: {
        code: 'INVALID_MOOD',
        message: `mood must be one of: ${VALID_MOODS.join(', ')}`,
      },
    });
    return;
  }

  const db = getDb();
  const id = randomUUID();

  db.insert(moodLog).values({
    id,
    familyId,
    childId: childId ?? null,
    mood: mood as Mood,
    loggedAt: Date.now(),
    note: note ?? null,
  }).run();

  const created = db.select().from(moodLog).where(eq(moodLog.id, id)).get();
  res.status(201).json({ data: created });
});

// DELETE /api/v1/mood/:id — remove a log entry
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const familyId = req.user!.familyId;
  const db = getDb();

  const existing = db.select().from(moodLog)
    .where(eq(moodLog.id, id))
    .get();

  if (!existing || existing.familyId !== familyId) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Mood entry not found' } });
    return;
  }

  db.delete(moodLog).where(eq(moodLog.id, id)).run();
  res.status(204).send();
});

export default router;
