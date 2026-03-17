import { Router, Response } from 'express';
import { eq, and, gte, asc, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import {
  tasks, taskCompletions, scheduleItems, events, moodLog,
  rewardTransactions, rewards, rewardRequests, modules, settings, childLayouts, children,
} from '../db/schema';
import { isNull, or } from 'drizzle-orm';
import { requireChildToken, ChildRequest } from '../middleware/childAuth';
import { broadcastToFamily } from '../websocket';
import { resolveItemsForWeek } from '../lib/scheduleDate';

const router = Router();
router.use(requireChildToken);

// ── Helpers ───────────────────────────────────────────────────

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function oneHourAgo(): number {
  return Date.now() - 60 * 60 * 1000;
}

/** Current day in Ebbe convention: 0=Mon … 6=Sun */
function todayDay(): number {
  const js = new Date().getDay(); // 0=Sun
  return js === 0 ? 6 : js - 1;
}

/** Parse "HH:MM" → minutes since midnight */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Is the task active for the current day and time window? */
function isTaskActiveNow(task: {
  daysOfWeek: string;
  timeStart: string | null;
  timeEnd: string | null;
}): boolean {
  const today = todayDay();
  let days: number[] = [0,1,2,3,4,5,6];
  try { days = JSON.parse(task.daysOfWeek) as number[]; } catch { /* default */ }
  if (!days.includes(today)) return false;

  // No time window = always active
  if (!task.timeStart && !task.timeEnd) return true;

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = task.timeStart ? toMinutes(task.timeStart) : 0;
  const endMins = task.timeEnd ? toMinutes(task.timeEnd) : 24 * 60;

  // Show within 2 hours before start through end of window
  return nowMins >= startMins - 120 && nowMins < endMins;
}

// ── Default widget layout ─────────────────────────────────────
const DEFAULT_LAYOUT = [
  { pageNumber: 1, widgetId: 'routine-morning',  order: 0, isEnabled: true,  config: '{}' },
  { pageNumber: 1, widgetId: 'routine-evening',  order: 1, isEnabled: true,  config: '{}' },
  { pageNumber: 1, widgetId: 'mood-checkin',     order: 2, isEnabled: true,  config: '{}' },
  { pageNumber: 1, widgetId: 'upcoming-event',   order: 3, isEnabled: true,  config: '{}' },
  { pageNumber: 1, widgetId: 'week-schedule',    order: 4, isEnabled: true,  config: '{}' },
  { pageNumber: 1, widgetId: 'timer-display',    order: 5, isEnabled: false, config: '{}' },
  { pageNumber: 2, widgetId: 'routine-custom',   order: 0, isEnabled: false, config: '{}' },
];

// ── Routes ────────────────────────────────────────────────────

// GET /api/v1/child/tasks — active tasks + today's completion status
router.get('/tasks', (req: ChildRequest, res: Response) => {
  const db = getDb();
  const familyId = req.familyId!;

  const taskRows = db.select().from(tasks)
    .where(and(eq(tasks.familyId, familyId), eq(tasks.isActive, true), eq(tasks.isVisibleToChild, true)))
    .orderBy(asc(tasks.order))
    .all();

  const childId = (req as ChildRequest).childId;
  const completions = db.select().from(taskCompletions)
    .where(and(
      eq(taskCompletions.familyId, familyId),
      gte(taskCompletions.completedAt, startOfToday()),
      ...(childId ? [eq(taskCompletions.childId, childId)] : []),
    ))
    .all();

  const completedIds = new Set(completions.map(c => c.taskId));

  // Filter by day/time window
  const filtered = taskRows.filter(t => isTaskActiveNow(t));

  res.json({ data: filtered.map(t => ({ ...t, isCompletedToday: completedIds.has(t.id) })) });
});

// POST /api/v1/child/tasks/:id/complete — complete a task, earn stars
router.post('/tasks/:id/complete', (req: ChildRequest, res: Response) => {
  const { id } = req.params;
  const familyId = req.familyId!;
  const childId = req.childId;
  const db = getDb();

  const task = db.select().from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.familyId, familyId), eq(tasks.isActive, true)))
    .get();

  if (!task) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
    return;
  }

  const alreadyDone = db.select().from(taskCompletions)
    .where(and(
      eq(taskCompletions.taskId, id),
      eq(taskCompletions.familyId, familyId),
      gte(taskCompletions.completedAt, startOfToday()),
      ...(childId ? [eq(taskCompletions.childId, childId)] : []),
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
    childId: childId ?? null,
    taskId: id,
    completedAt: now,
    starsAwarded: task.starValue,
  }).run();

  db.insert(rewardTransactions).values({
    id: randomUUID(),
    familyId,
    childId: childId ?? null,
    type: 'earn',
    amount: task.starValue,
    description: task.title,
    relatedId: id,
    createdAt: now,
  }).run();

  const txRows = db.select().from(rewardTransactions)
    .where(and(
      eq(rewardTransactions.familyId, familyId),
      ...(childId ? [eq(rewardTransactions.childId, childId)] : []),
    ))
    .all();
  const balance = txRows.reduce((acc, r) => r.type === 'earn' ? acc + r.amount : acc - r.amount, 0);
  broadcastToFamily(familyId, 'all', { type: 'STARS_UPDATED', payload: { balance } });

  res.status(201).json({ data: { starsAwarded: task.starValue, balance } });
});

// GET /api/v1/child/schedule — weekly schedule resolved for current week
router.get('/schedule', (req: ChildRequest, res: Response) => {
  const db = getDb();
  const familyId = req.familyId!;
  const childId = req.childId;

  const rows = db.select().from(scheduleItems)
    .where(and(
      eq(scheduleItems.familyId, familyId),
      // Show family-wide items (childId IS NULL) OR items assigned to this child
      childId ? or(isNull(scheduleItems.childId), eq(scheduleItems.childId, childId)) : isNull(scheduleItems.childId),
    ))
    .orderBy(asc(scheduleItems.dayOfWeek), asc(scheduleItems.timeStart))
    .all();

  // Resolve date-specific items for the current week; pure weekly items always pass through.
  // Return dayOfWeek as effectiveDayOfWeek so the child UI needs no changes.
  const resolved = resolveItemsForWeek(rows).map(item => ({
    ...item,
    dayOfWeek: item.effectiveDayOfWeek,
  }));

  res.json({ data: resolved });
});

// GET /api/v1/child/events — upcoming visible events (family-wide OR assigned to this child)
router.get('/events', (req: ChildRequest, res: Response) => {
  const db = getDb();
  const familyId = req.familyId!;
  const childId = req.childId;

  const rows = db.select().from(events)
    .where(and(
      eq(events.familyId, familyId),
      eq(events.isVisible, true),
      gte(events.eventDate, Date.now()),
      // Show family-wide events (childId IS NULL) OR events assigned to this child
      childId ? or(isNull(events.childId), eq(events.childId, childId)) : isNull(events.childId),
    ))
    .orderBy(asc(events.eventDate))
    .all();

  res.json({ data: rows });
});

// GET /api/v1/child/balance — current star balance
router.get('/balance', (req: ChildRequest, res: Response) => {
  const db = getDb();
  const familyId = req.familyId!;
  const childId = req.childId;

  const rows = db.select().from(rewardTransactions)
    .where(and(
      eq(rewardTransactions.familyId, familyId),
      ...(childId ? [eq(rewardTransactions.childId, childId)] : []),
    ))
    .all();
  const balance = rows.reduce((acc, r) => r.type === 'earn' ? acc + r.amount : acc - r.amount, 0);

  res.json({ data: { balance } });
});

// GET /api/v1/child/transactions — recent star history (for history view)
router.get('/transactions', (req: ChildRequest, res: Response) => {
  const db = getDb();
  const familyId = req.familyId!;
  const childId = req.childId;
  const limit = Math.min(parseInt(req.query.limit as string || '30'), 100);

  const rows = db.select().from(rewardTransactions)
    .where(and(
      eq(rewardTransactions.familyId, familyId),
      ...(childId ? [eq(rewardTransactions.childId, childId)] : []),
    ))
    .orderBy(desc(rewardTransactions.createdAt))
    .limit(limit)
    .all();

  res.json({ data: rows });
});

// GET /api/v1/child/rewards — active rewards (for star store)
router.get('/rewards', (req: ChildRequest, res: Response) => {
  const db = getDb();
  const familyId = req.familyId!;

  const rows = db.select().from(rewards)
    .where(and(eq(rewards.familyId, familyId), eq(rewards.isActive, true)))
    .all();

  res.json({ data: rows });
});

// POST /api/v1/child/rewards/:id/request — child requests a reward
router.post('/rewards/:id/request', (req: ChildRequest, res: Response) => {
  const { id } = req.params;
  const familyId = req.familyId!;
  const db = getDb();

  const reward = db.select().from(rewards)
    .where(and(eq(rewards.id, id), eq(rewards.familyId, familyId), eq(rewards.isActive, true)))
    .get();

  if (!reward) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Reward not found' } });
    return;
  }

  // Check if there's already a pending request for this reward
  const existing = db.select().from(rewardRequests)
    .where(and(
      eq(rewardRequests.familyId, familyId),
      eq(rewardRequests.rewardId, id),
      eq(rewardRequests.status, 'pending'),
    ))
    .get();

  if (existing) {
    res.status(409).json({ error: { code: 'ALREADY_REQUESTED', message: 'Already requested' } });
    return;
  }

  const requestId = randomUUID();
  db.insert(rewardRequests).values({
    id: requestId,
    familyId,
    childId: req.childId ?? null,
    rewardId: id,
    status: 'pending',
    requestedAt: Date.now(),
    resolvedAt: null,
  }).run();

  // Notify parent
  broadcastToFamily(familyId, 'parent', { type: 'REWARD_REQUESTED', payload: { requestId, rewardId: id, rewardTitle: reward.title } });

  res.status(201).json({ data: { requestId } });
});

// GET /api/v1/child/mood/status — cooldown status (scoped to this child)
router.get('/mood/status', (req: ChildRequest, res: Response) => {
  const familyId = req.familyId!;
  const childId = req.childId;
  const db = getDb();

  const recent = db.select().from(moodLog)
    .where(and(
      eq(moodLog.familyId, familyId),
      gte(moodLog.loggedAt, oneHourAgo()),
      ...(childId ? [eq(moodLog.childId, childId)] : [isNull(moodLog.childId)]),
    ))
    .get();

  if (recent) {
    res.json({ data: { canLog: false, cooldownEndsAt: recent.loggedAt + 60 * 60 * 1000 } });
  } else {
    res.json({ data: { canLog: true, cooldownEndsAt: null } });
  }
});

// POST /api/v1/child/mood — log a mood (max once per hour, scoped to this child)
router.post('/mood', (req: ChildRequest, res: Response) => {
  const { mood } = req.body as { mood?: string };
  const familyId = req.familyId!;
  const childId = req.childId;

  const VALID_MOODS = ['happy', 'okay', 'sad', 'angry', 'tired', 'excited', 'anxious'];
  if (!mood || !VALID_MOODS.includes(mood)) {
    res.status(400).json({ error: { code: 'INVALID_MOOD', message: 'Invalid mood value' } });
    return;
  }

  const db = getDb();

  const existing = db.select().from(moodLog)
    .where(and(
      eq(moodLog.familyId, familyId),
      gte(moodLog.loggedAt, oneHourAgo()),
      ...(childId ? [eq(moodLog.childId, childId)] : [isNull(moodLog.childId)]),
    ))
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
    childId: childId ?? null,
    mood: mood as 'happy' | 'okay' | 'sad' | 'angry' | 'tired' | 'excited' | 'anxious',
    loggedAt: Date.now(),
    note: null,
  }).run();

  res.status(201).json({ data: { id, mood } });
});

// GET /api/v1/child/layout — widget layout for child screen
router.get('/layout', (req: ChildRequest, res: Response) => {
  const familyId = req.familyId!;
  const childId = req.childId ?? '';
  const db = getDb();

  // Try per-child layout first; fall back to family default (childId = '')
  let rows = db.select().from(childLayouts)
    .where(and(eq(childLayouts.familyId, familyId), eq(childLayouts.childId, childId)))
    .orderBy(asc(childLayouts.pageNumber), asc(childLayouts.order))
    .all();

  if (rows.length === 0 && childId !== '') {
    rows = db.select().from(childLayouts)
      .where(and(eq(childLayouts.familyId, familyId), eq(childLayouts.childId, '')))
      .orderBy(asc(childLayouts.pageNumber), asc(childLayouts.order))
      .all();
  }

  if (rows.length === 0) {
    // Return default layout (not persisted — saved only when parent customises)
    return res.json({ data: DEFAULT_LAYOUT });
  }

  res.json({ data: rows });
});

// GET /api/v1/child/settings — all child-relevant settings in one call
router.get('/settings', (req: ChildRequest, res: Response) => {
  const familyId = req.familyId!;
  const childId = req.childId;
  const db = getDb();

  const rows = db.select().from(settings).where(eq(settings.familyId, familyId)).all();
  const map = new Map(rows.map(r => [r.key, r.value]));

  function getSetting<T>(key: string, fallback: T): T {
    const val = map.get(key);
    if (val === undefined) return fallback;
    try { return JSON.parse(val) as T; } catch { return fallback; }
  }

  // Per-child accent color takes precedence over family-level setting
  let accentColor = getSetting<string>('child.accentColor', '#1565C0');
  if (childId) {
    const child = db.select().from(children).where(eq(children.id, childId)).get();
    if (child?.color) accentColor = child.color;
  }

  res.json({
    data: {
      accentColor,
      storeEnabled: getSetting<boolean>('store.enabled', false),
      historyEnabled: getSetting<boolean>('history.enabled', false),
      inactivitySeconds: getSetting<number>('inactivity.seconds', 45),
      activeMoods: getSetting<string[] | null>('mood.active', null),
      language: getSetting<string>('family.language', 'en'),
    },
  });
});

// GET /api/v1/child/theme — child accent colour (kept for backwards compat)
router.get('/theme', (req: ChildRequest, res: Response) => {
  const familyId = req.familyId!;
  const childId = req.childId;
  const db = getDb();

  const row = db.select().from(settings)
    .where(and(eq(settings.familyId, familyId), eq(settings.key, 'child.accentColor')))
    .get();

  let accentColor = row ? (JSON.parse(row.value) as string) : '#1565C0';
  if (childId) {
    const child = db.select().from(children).where(eq(children.id, childId)).get();
    if (child?.color) accentColor = child.color;
  }

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
