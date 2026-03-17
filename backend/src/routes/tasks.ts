import { Router, Response } from 'express';
import { eq, and, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { tasks, taskCompletions, rewardTransactions } from '../db/schema';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { broadcastToFamily } from '../websocket';

const router = Router();

// All task routes require a logged-in parent
router.use(requireAuth);

// GET /api/v1/tasks — list all tasks for the family
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const familyId = req.user!.familyId;

  const rows = db.select().from(tasks)
    .where(eq(tasks.familyId, familyId))
    .orderBy(asc(tasks.order))
    .all();

  res.json({ data: rows });
});

// POST /api/v1/tasks — create a task
router.post('/', (req: AuthRequest, res: Response) => {
  const { title, emoji, routine, routineName, order, starValue, isVisibleToChild, daysOfWeek, timeStart, timeEnd } = req.body as {
    title?: string;
    emoji?: string;
    routine?: string;
    routineName?: string;
    order?: number;
    starValue?: number;
    isVisibleToChild?: boolean;
    daysOfWeek?: number[];
    timeStart?: string;
    timeEnd?: string;
  };
  const familyId = req.user!.familyId;

  if (!title || !routine) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'title and routine are required' } });
    return;
  }
  if (!['morning', 'evening', 'custom'].includes(routine)) {
    res.status(400).json({ error: { code: 'INVALID_ROUTINE', message: 'routine must be morning, evening, or custom' } });
    return;
  }

  const db = getDb();
  const now = Date.now();
  const id = randomUUID();

  db.insert(tasks).values({
    id,
    familyId,
    title,
    emoji: emoji ?? '⭐',
    routine: routine as 'morning' | 'evening' | 'custom',
    routineName: routineName ?? null,
    order: order ?? 0,
    starValue: starValue ?? 1,
    isActive: true,
    isVisibleToChild: isVisibleToChild !== false,
    daysOfWeek: daysOfWeek ? JSON.stringify(daysOfWeek) : JSON.stringify([0,1,2,3,4,5,6]),
    timeStart: timeStart ?? null,
    timeEnd: timeEnd ?? null,
    focusModeEnabled: false,
    createdAt: now,
  }).run();

  const created = db.select().from(tasks).where(eq(tasks.id, id)).get();

  // Notify child screen of new task
  broadcastToFamily(familyId, 'child', { type: 'TASK_UPDATED', payload: { taskId: id, action: 'created' } });

  res.status(201).json({ data: created });
});

// PATCH /api/v1/tasks/:id — update a task
router.patch('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const familyId = req.user!.familyId;
  const db = getDb();

  const existing = db.select().from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.familyId, familyId)))
    .get();

  if (!existing) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
    return;
  }

  const { title, emoji, routine, routineName, order, starValue, isActive, isVisibleToChild, daysOfWeek, timeStart, timeEnd, focusModeEnabled } = req.body as {
    title?: string;
    emoji?: string;
    routine?: string;
    routineName?: string;
    order?: number;
    starValue?: number;
    isActive?: boolean;
    isVisibleToChild?: boolean;
    daysOfWeek?: number[];
    timeStart?: string | null;
    timeEnd?: string | null;
    focusModeEnabled?: boolean;
  };

  if (routine && !['morning', 'evening', 'custom'].includes(routine)) {
    res.status(400).json({ error: { code: 'INVALID_ROUTINE', message: 'routine must be morning, evening, or custom' } });
    return;
  }

  db.update(tasks)
    .set({
      ...(title !== undefined && { title }),
      ...(emoji !== undefined && { emoji }),
      ...(routine !== undefined && { routine: routine as 'morning' | 'evening' | 'custom' }),
      ...(routineName !== undefined && { routineName }),
      ...(order !== undefined && { order }),
      ...(starValue !== undefined && { starValue }),
      ...(isActive !== undefined && { isActive }),
      ...(isVisibleToChild !== undefined && { isVisibleToChild }),
      ...(daysOfWeek !== undefined && { daysOfWeek: JSON.stringify(daysOfWeek) }),
      ...(timeStart !== undefined && { timeStart }),
      ...(timeEnd !== undefined && { timeEnd }),
      ...(focusModeEnabled !== undefined && { focusModeEnabled }),
    })
    .where(and(eq(tasks.id, id), eq(tasks.familyId, familyId)))
    .run();

  const updated = db.select().from(tasks).where(eq(tasks.id, id)).get();

  // Notify child screen of task change
  broadcastToFamily(familyId, 'child', { type: 'TASK_UPDATED', payload: { taskId: id, action: 'updated' } });

  res.json({ data: updated });
});

// DELETE /api/v1/tasks/:id — delete a task
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const familyId = req.user!.familyId;
  const db = getDb();

  const existing = db.select().from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.familyId, familyId)))
    .get();

  if (!existing) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
    return;
  }

  db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.familyId, familyId))).run();

  // Notify child screen task was removed
  broadcastToFamily(familyId, 'child', { type: 'TASK_UPDATED', payload: { taskId: id, action: 'deleted' } });

  res.status(204).send();
});

// POST /api/v1/tasks/:id/complete — parent marks a task done (for non-visible tasks)
// Body: optional childId — which child gets the credit
router.post('/:id/complete', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const familyId = req.user!.familyId;
  const { childId } = req.body as { childId?: string };
  const db = getDb();

  const task = db.select().from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.familyId, familyId)))
    .get();

  if (!task) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
    return;
  }
  if (!task.isActive) {
    res.status(400).json({ error: { code: 'TASK_INACTIVE', message: 'Task is not active' } });
    return;
  }

  const now = Date.now();
  const completionId = randomUUID();

  db.insert(taskCompletions).values({
    id: completionId,
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

  // Recalculate balance scoped to the child and broadcast
  const txRows = db.select().from(rewardTransactions)
    .where(and(
      eq(rewardTransactions.familyId, familyId),
      ...(childId ? [eq(rewardTransactions.childId, childId)] : []),
    ))
    .all();
  const balance = txRows.reduce((acc, r) => r.type === 'earn' ? acc + r.amount : acc - r.amount, 0);
  broadcastToFamily(familyId, 'all', { type: 'STARS_UPDATED', payload: { balance } });
  broadcastToFamily(familyId, 'child', { type: 'TASK_UPDATED', payload: { taskId: id, action: 'completed' } });

  res.status(201).json({
    data: {
      completionId,
      starsAwarded: task.starValue,
      balance,
    },
  });
});

export default router;
