import { Router, Response } from 'express';
import { eq, and, gte, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { tasks, taskCompletions, scheduleItems, events, moodLog, rewardTransactions, modules, settings } from '../db/schema';
import { requireChildToken, ChildRequest } from '../middleware/childAuth';
import { broadcastToFamily } from '../websocket';

const router = Router();
router.use(requireChildToken);

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function oneHourAgo(): number {
  return Date.now() - 60 * 60 * 1000;
}

// GET /api/v1/child/tasks — active tasks + today's completion status
router.get('/tasks', (req: ChildRequest, res: Response) => {
  const db = getDb();
  const familyId = req.familyId!;

  const taskRows = db.select().from(tasks)
    .where(and(eq(tasks.familyId, familyId), eq(tasks.isActive, true)))
    .orderBy(asc(tasks.order))
    .all();

  const completions = db.select().from(taskCompletions)
    .where(and(eq(taskCompletions.familyId, familyId), gte(taskCompletions.completedAt, startOfToday())))
    .all();

  const completedIds = new Set(completions.map(c => c.taskId));

  res.json({ data: taskRows.map(t => ({ ...t, isCompletedToday: completedIds.has(t.id) })) });
});

// POST /api/v1/child/tasks/:id/complete — complete a task, earn stars
router.post('/tasks/:id/complete', (req: ChildRequest, res: Response) => {
  const { id } = req.params;
  const familyId = req.familyId!;
  const db = getDb();

  const task = db.select().from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.familyId, familyId), eq(tasks.isActive, true)))
    .get();

  if (!task) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
    return;
  }

  // Prevent double-completion on the same day
  const alreadyDone = db.select().from(taskCompletions)
    .where(and(
      eq(taskCompletions.taskId, id),
      eq(taskCompletions.familyId, familyId),
      gte(taskCompletions.completedAt, startOfToday()),
    ))
    .get();

  if (alreadyDone) {
    res.status(409).json({ error: { code: 'ALREADY_COMPLETED', message: 'Task already completed today' } });
    return;
  }

  const now = Date.now();

  db.insert(taskCompletions).values({
    id: randomUUID(),
    familyId,
    taskId: id,
    completedAt: now,
    starsAwarded: task.starValue,
  }).run();

  db.insert(rewardTransactions).values({
    id: randomUUID(),
    familyId,
    type: 'earn',
    amount: task.starValue,
    description: task.title,
    relatedId: id,
    createdAt: now,
  }).run();

  // Calculate new balance and broadcast to all family clients
  const txRows = db.select().from(rewardTransactions).where(eq(rewardTransactions.familyId, familyId)).all();
  const balance = txRows.reduce((acc, r) => r.type === 'earn' ? acc + r.amount : acc - r.amount, 0);
  broadcastToFamily(familyId, 'all', { type: 'STARS_UPDATED', payload: { balance } });

  res.status(201).json({ data: { starsAwarded: task.starValue, balance } });
});

// GET /api/v1/child/schedule — full weekly schedule
router.get('/schedule', (req: ChildRequest, res: Response) => {
  const db = getDb();
  const familyId = req.familyId!;

  const rows = db.select().from(scheduleItems)
    .where(eq(scheduleItems.familyId, familyId))
    .orderBy(asc(scheduleItems.dayOfWeek), asc(scheduleItems.timeStart))
    .all();

  res.json({ data: rows });
});

// GET /api/v1/child/events — upcoming visible events
router.get('/events', (req: ChildRequest, res: Response) => {
  const db = getDb();
  const familyId = req.familyId!;

  const rows = db.select().from(events)
    .where(and(eq(events.familyId, familyId), eq(events.isVisible, true), gte(events.eventDate, Date.now())))
    .orderBy(asc(events.eventDate))
    .all();

  res.json({ data: rows });
});

// GET /api/v1/child/balance — current star balance
router.get('/balance', (req: ChildRequest, res: Response) => {
  const db = getDb();
  const familyId = req.familyId!;

  const rows = db.select().from(rewardTransactions).where(eq(rewardTransactions.familyId, familyId)).all();
  const balance = rows.reduce((acc, r) => r.type === 'earn' ? acc + r.amount : acc - r.amount, 0);

  res.json({ data: { balance } });
});

// GET /api/v1/child/mood/status — cooldown status (can the child log mood now?)
router.get('/mood/status', (req: ChildRequest, res: Response) => {
  const familyId = req.familyId!;
  const db = getDb();

  const recent = db.select().from(moodLog)
    .where(and(eq(moodLog.familyId, familyId), gte(moodLog.loggedAt, oneHourAgo())))
    .get();

  if (recent) {
    const cooldownEndsAt = recent.loggedAt + 60 * 60 * 1000;
    res.json({ data: { canLog: false, cooldownEndsAt } });
  } else {
    res.json({ data: { canLog: true, cooldownEndsAt: null } });
  }
});

// POST /api/v1/child/mood — log a mood (max once per hour)
router.post('/mood', (req: ChildRequest, res: Response) => {
  const { mood } = req.body as { mood?: string };
  const familyId = req.familyId!;

  const VALID_MOODS = ['happy', 'okay', 'sad', 'angry', 'tired', 'excited', 'anxious'];
  if (!mood || !VALID_MOODS.includes(mood)) {
    res.status(400).json({ error: { code: 'INVALID_MOOD', message: 'Invalid mood value' } });
    return;
  }

  const db = getDb();

  // Only allow one entry per hour
  const existing = db.select().from(moodLog)
    .where(and(eq(moodLog.familyId, familyId), gte(moodLog.loggedAt, oneHourAgo())))
    .get();

  if (existing) {
    const cooldownEndsAt = existing.loggedAt + 60 * 60 * 1000;
    res.status(409).json({ error: { code: 'ALREADY_LOGGED', message: 'Mood already logged this hour', cooldownEndsAt } });
    return;
  }

  const id = randomUUID();
  db.insert(moodLog).values({
    id,
    familyId,
    mood: mood as 'happy' | 'okay' | 'sad' | 'angry' | 'tired' | 'excited' | 'anxious',
    loggedAt: Date.now(),
    note: null,
  }).run();

  res.status(201).json({ data: { id, mood } });
});

// GET /api/v1/child/theme — child accent colour from family settings
router.get('/theme', (req: ChildRequest, res: Response) => {
  const familyId = req.familyId!;
  const db = getDb();

  const row = db.select().from(settings)
    .where(and(eq(settings.familyId, familyId), eq(settings.key, 'child.accentColor')))
    .get();

  const accentColor = row ? (JSON.parse(row.value) as string) : '#1565C0';
  res.json({ data: { accentColor } });
});

// GET /api/v1/child/weather — weather if module is enabled
router.get('/weather', async (req: ChildRequest, res: Response) => {
  const familyId = req.familyId!;
  const db = getDb();

  const row = db.select().from(modules)
    .where(and(eq(modules.familyId, familyId), eq(modules.moduleId, 'weather-openmeteo')))
    .get();

  if (!row || !row.isEnabled) {
    res.json({ data: null });
    return;
  }

  let cfg: { lat?: number; lon?: number; locationName?: string } = {};
  try { cfg = JSON.parse(row.config); } catch { /* ignore */ }

  if (cfg.lat === undefined || cfg.lon === undefined) {
    res.json({ data: null });
    return;
  }

  try {
    const { weatherOpenMeteo } = await import('../modules/weather-openmeteo');
    const weather = await weatherOpenMeteo.fetchWeather(cfg.lat, cfg.lon);
    res.json({ data: { ...weather, locationName: cfg.locationName ?? '', updatedAt: weather.updatedAt.toISOString() } });
  } catch {
    res.json({ data: null });
  }
});

export default router;
