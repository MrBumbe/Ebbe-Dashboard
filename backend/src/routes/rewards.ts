import { Router, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { rewards, rewardTransactions, rewardRequests } from '../db/schema';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { broadcastToFamily } from '../websocket';

const router = Router();

router.use(requireAuth);

// GET /api/v1/rewards/balance — current star balance for the family
router.get('/balance', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const familyId = req.user!.familyId;

  const rows = db.select().from(rewardTransactions)
    .where(eq(rewardTransactions.familyId, familyId))
    .all();

  const balance = rows.reduce((acc, row) => {
    return row.type === 'earn' ? acc + row.amount : acc - row.amount;
  }, 0);

  res.json({ data: { balance } });
});

// GET /api/v1/rewards/transactions — star ledger history
router.get('/transactions', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const familyId = req.user!.familyId;

  const rows = db.select().from(rewardTransactions)
    .where(eq(rewardTransactions.familyId, familyId))
    .orderBy(desc(rewardTransactions.createdAt))
    .all();

  res.json({ data: rows });
});

// GET /api/v1/rewards/requests — pending child redemption requests
router.get('/requests', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const familyId = req.user!.familyId;

  const requests = db.select().from(rewardRequests)
    .where(eq(rewardRequests.familyId, familyId))
    .orderBy(desc(rewardRequests.requestedAt))
    .all();

  // Join reward details
  const allRewards = db.select().from(rewards).where(eq(rewards.familyId, familyId)).all();
  const rewardMap = new Map(allRewards.map(r => [r.id, r]));

  const enriched = requests.map(r => ({
    ...r,
    reward: rewardMap.get(r.rewardId) ?? null,
  }));

  res.json({ data: enriched });
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

    // Check balance
    const txRows = db.select().from(rewardTransactions).where(eq(rewardTransactions.familyId, familyId)).all();
    const balance = txRows.reduce((acc, r) => r.type === 'earn' ? acc + r.amount : acc - r.amount, 0);

    if (balance < reward.starCost) {
      res.status(400).json({ error: { code: 'INSUFFICIENT_STARS', message: `Need ${reward.starCost} stars, have ${balance}` } });
      return;
    }

    // Deduct stars
    db.insert(rewardTransactions).values({
      id: randomUUID(),
      familyId,
      type: 'redeem',
      amount: reward.starCost,
      description: `Redeemed: ${reward.title}`,
      relatedId: reward.id,
      createdAt: now,
    }).run();

    // Recalculate and broadcast
    const newTxRows = db.select().from(rewardTransactions).where(eq(rewardTransactions.familyId, familyId)).all();
    const newBalance = newTxRows.reduce((acc, r) => r.type === 'earn' ? acc + r.amount : acc - r.amount, 0);
    broadcastToFamily(familyId, 'all', { type: 'STARS_UPDATED', payload: { balance: newBalance } });
  }

  db.update(rewardRequests)
    .set({ status: action === 'approve' ? 'approved' : 'denied', resolvedAt: now })
    .where(eq(rewardRequests.id, id))
    .run();

  // Notify child of decision
  broadcastToFamily(familyId, 'child', {
    type: 'REQUEST_RESOLVED',
    payload: { requestId: id, action },
  });

  res.json({ data: { id, status: action === 'approve' ? 'approved' : 'denied' } });
});

// POST /api/v1/rewards/adjust — manual star adjustment by parent
router.post('/adjust', requireRole('admin', 'parent'), (req: AuthRequest, res: Response) => {
  const { amount, description } = req.body as { amount?: number; description?: string };
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
    type: amount > 0 ? 'earn' : 'redeem',
    amount: Math.abs(amount),
    description,
    relatedId: null,
    createdAt: now,
  }).run();

  const txRows = db.select().from(rewardTransactions).where(eq(rewardTransactions.familyId, familyId)).all();
  const balance = txRows.reduce((acc, r) => r.type === 'earn' ? acc + r.amount : acc - r.amount, 0);

  broadcastToFamily(familyId, 'all', { type: 'STARS_UPDATED', payload: { balance } });

  res.status(201).json({ data: { balance } });
});

// GET /api/v1/rewards — list reward catalog
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
