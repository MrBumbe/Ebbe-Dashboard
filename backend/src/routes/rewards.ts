import { Router, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { rewards, rewardTransactions, rewardRequests } from '../db/schema';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { broadcastToFamily } from '../websocket';

const router = Router();

router.use(requireAuth);

function calcBalance(rows: Array<{ type: string; amount: number }>) {
  return rows.reduce((acc, r) => r.type === 'earn' ? acc + r.amount : acc - r.amount, 0);
}

// GET /api/v1/rewards/balance — current star balance; optional ?childId= filter
router.get('/balance', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const familyId = req.user!.familyId;
  const childId = req.query.childId as string | undefined;

  const rows = db.select().from(rewardTransactions)
    .where(and(
      eq(rewardTransactions.familyId, familyId),
      ...(childId ? [eq(rewardTransactions.childId, childId)] : []),
    ))
    .all();

  res.json({ data: { balance: calcBalance(rows) } });
});

// GET /api/v1/rewards/transactions — star ledger history; optional ?childId= filter
router.get('/transactions', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const familyId = req.user!.familyId;
  const childId = req.query.childId as string | undefined;

  const rows = db.select().from(rewardTransactions)
    .where(and(
      eq(rewardTransactions.familyId, familyId),
      ...(childId ? [eq(rewardTransactions.childId, childId)] : []),
    ))
    .orderBy(desc(rewardTransactions.createdAt))
    .all();

  res.json({ data: rows });
});

// GET /api/v1/rewards/requests — pending child redemption requests; optional ?childId= filter
router.get('/requests', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const familyId = req.user!.familyId;
  const childId = req.query.childId as string | undefined;

  const requests = db.select().from(rewardRequests)
    .where(and(
      eq(rewardRequests.familyId, familyId),
      ...(childId ? [eq(rewardRequests.childId, childId)] : []),
    ))
    .orderBy(desc(rewardRequests.requestedAt))
    .all();

  const allRewards = db.select().from(rewards).where(eq(rewards.familyId, familyId)).all();
  const rewardMap = new Map(allRewards.map(r => [r.id, r]));

  res.json({ data: requests.map(r => ({ ...r, reward: rewardMap.get(r.rewardId) ?? null })) });
});

// PATCH /api/v1/rewards/requests/:id — approve or deny a request
router.patch('/requests/:id', requireRole('admin', 'parent'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const familyId = req.user!.familyId;
  const { action } = req.body as { action?: 'approve' | 'deny' };

  if (!action || !['approve', 'deny'].includes(action)) {
    res.status(400).json({ error: { code: 'INVALID_ACTION', message: 'action must be approve or deny' } });
    return;
  }

  const db = getDb();

  const request = db.select().from(rewardRequests)
    .where(and(eq(rewardRequests.id, id), eq(rewardRequests.familyId, familyId)))
    .get();

  if (!request) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Request not found' } });
    return;
  }

  if (request.status !== 'pending') {
    res.status(409).json({ error: { code: 'ALREADY_RESOLVED', message: 'Request already resolved' } });
    return;
  }

  const now = Date.now();

  if (action === 'approve') {
    const reward = db.select().from(rewards)
      .where(and(eq(rewards.id, request.rewardId), eq(rewards.familyId, familyId)))
      .get();

    if (!reward) {
      res.status(404).json({ error: { code: 'REWARD_NOT_FOUND', message: 'Reward not found' } });
      return;
    }

    // Check balance scoped to the requesting child (when childId is known)
    const childId = request.childId ?? undefined;
    const txRows = db.select().from(rewardTransactions)
      .where(and(
        eq(rewardTransactions.familyId, familyId),
        ...(childId ? [eq(rewardTransactions.childId, childId)] : []),
      ))
      .all();
    const balance = calcBalance(txRows);

    if (balance < reward.starCost) {
      res.status(400).json({ error: { code: 'INSUFFICIENT_STARS', message: `Need ${reward.starCost} stars, have ${balance}` } });
      return;
    }

    // Deduct stars (scoped to child)
    db.insert(rewardTransactions).values({
      id: randomUUID(),
      familyId,
      childId: childId ?? null,
      type: 'redeem',
      amount: reward.starCost,
      description: `Redeemed: ${reward.title}`,
      relatedId: reward.id,
      createdAt: now,
    }).run();

    // Recalculate and broadcast new child balance
    const newTxRows = db.select().from(rewardTransactions)
      .where(and(
        eq(rewardTransactions.familyId, familyId),
        ...(childId ? [eq(rewardTransactions.childId, childId)] : []),
      ))
      .all();
    const newBalance = calcBalance(newTxRows);
    broadcastToFamily(familyId, 'all', { type: 'STARS_UPDATED', payload: { balance: newBalance } });
  }

  db.update(rewardRequests)
    .set({ status: action === 'approve' ? 'approved' : 'denied', resolvedAt: now })
    .where(eq(rewardRequests.id, id))
    .run();

  broadcastToFamily(familyId, 'child', {
    type: 'REQUEST_RESOLVED',
    payload: { requestId: id, action },
  });

  res.json({ data: { id, status: action === 'approve' ? 'approved' : 'denied' } });
});

// POST /api/v1/rewards/adjust — manual star adjustment; requires childId in body
router.post('/adjust', requireRole('admin', 'parent'), (req: AuthRequest, res: Response) => {
  const { amount, description, childId } = req.body as { amount?: number; description?: string; childId?: string };
  const familyId = req.user!.familyId;

  if (amount === undefined || !description) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'amount and description are required' } });
    return;
  }
  if (!Number.isInteger(amount) || amount === 0) {
    res.status(400).json({ error: { code: 'INVALID_AMOUNT', message: 'amount must be a non-zero integer' } });
    return;
  }

  const db = getDb();
  const now = Date.now();

  db.insert(rewardTransactions).values({
    id: randomUUID(),
    familyId,
    childId: childId ?? null,
    type: amount > 0 ? 'earn' : 'redeem',
    amount: Math.abs(amount),
    description,
    relatedId: null,
    createdAt: now,
  }).run();

  const txRows = db.select().from(rewardTransactions)
    .where(and(
      eq(rewardTransactions.familyId, familyId),
      ...(childId ? [eq(rewardTransactions.childId, childId)] : []),
    ))
    .all();
  const balance = calcBalance(txRows);

  broadcastToFamily(familyId, 'all', { type: 'STARS_UPDATED', payload: { balance } });

  res.status(201).json({ data: { balance } });
});

// GET /api/v1/rewards — list reward catalog (family-wide)
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const familyId = req.user!.familyId;

  const rows = db.select().from(rewards)
    .where(eq(rewards.familyId, familyId))
    .all();

  res.json({ data: rows });
});

// POST /api/v1/rewards — create a reward (admin/parent only)
router.post('/', requireRole('admin', 'parent'), (req: AuthRequest, res: Response) => {
  const { title, emoji, starCost } = req.body as {
    title?: string;
    emoji?: string;
    starCost?: number;
  };
  const familyId = req.user!.familyId;

  if (!title || starCost === undefined) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'title and starCost are required' } });
    return;
  }
  if (!Number.isInteger(starCost) || starCost < 1) {
    res.status(400).json({ error: { code: 'INVALID_STAR_COST', message: 'starCost must be a positive integer' } });
    return;
  }

  const db = getDb();
  const id = randomUUID();

  db.insert(rewards).values({
    id,
    familyId,
    title,
    emoji: emoji ?? '🎁',
    starCost,
    isActive: true,
  }).run();

  const created = db.select().from(rewards).where(eq(rewards.id, id)).get();
  res.status(201).json({ data: created });
});

// PATCH /api/v1/rewards/:id — update a reward
router.patch('/:id', requireRole('admin', 'parent'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const familyId = req.user!.familyId;
  const db = getDb();

  const existing = db.select().from(rewards)
    .where(and(eq(rewards.id, id), eq(rewards.familyId, familyId)))
    .get();

  if (!existing) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Reward not found' } });
    return;
  }

  const { title, emoji, starCost, isActive } = req.body as {
    title?: string;
    emoji?: string;
    starCost?: number;
    isActive?: boolean;
  };

  if (starCost !== undefined && (!Number.isInteger(starCost) || starCost < 1)) {
    res.status(400).json({ error: { code: 'INVALID_STAR_COST', message: 'starCost must be a positive integer' } });
    return;
  }

  db.update(rewards)
    .set({
      ...(title !== undefined && { title }),
      ...(emoji !== undefined && { emoji }),
      ...(starCost !== undefined && { starCost }),
      ...(isActive !== undefined && { isActive }),
    })
    .where(and(eq(rewards.id, id), eq(rewards.familyId, familyId)))
    .run();

  const updated = db.select().from(rewards).where(eq(rewards.id, id)).get();
  res.json({ data: updated });
});

// DELETE /api/v1/rewards/:id — delete a reward
router.delete('/:id', requireRole('admin', 'parent'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const familyId = req.user!.familyId;
  const db = getDb();

  const existing = db.select().from(rewards)
    .where(and(eq(rewards.id, id), eq(rewards.familyId, familyId)))
    .get();

  if (!existing) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Reward not found' } });
    return;
  }

  db.delete(rewards).where(and(eq(rewards.id, id), eq(rewards.familyId, familyId))).run();
  res.status(204).send();
});

export default router;
