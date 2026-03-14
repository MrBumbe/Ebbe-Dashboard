import { Router, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { rewards, rewardTransactions } from '../db/schema';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

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
    .all();

  res.json({ data: rows });
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

// POST /api/v1/rewards/:id/redeem — redeem a reward, deduct stars
router.post('/:id/redeem', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const familyId = req.user!.familyId;
  const db = getDb();

  const reward = db.select().from(rewards)
    .where(and(eq(rewards.id, id), eq(rewards.familyId, familyId)))
    .get();

  if (!reward) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Reward not found' } });
    return;
  }
  if (!reward.isActive) {
    res.status(400).json({ error: { code: 'REWARD_INACTIVE', message: 'Reward is not active' } });
    return;
  }

  // Check current balance
  const transactions = db.select().from(rewardTransactions)
    .where(eq(rewardTransactions.familyId, familyId))
    .all();

  const balance = transactions.reduce((acc, row) => {
    return row.type === 'earn' ? acc + row.amount : acc - row.amount;
  }, 0);

  if (balance < reward.starCost) {
    res.status(400).json({
      error: {
        code: 'INSUFFICIENT_STARS',
        message: `Need ${reward.starCost} stars, but balance is ${balance}`,
      },
    });
    return;
  }

  const transactionId = randomUUID();
  db.insert(rewardTransactions).values({
    id: transactionId,
    familyId,
    type: 'redeem',
    amount: reward.starCost,
    description: `Redeemed: ${reward.title}`,
    relatedId: id,
    createdAt: Date.now(),
  }).run();

  res.status(201).json({
    data: {
      transactionId,
      starsSpent: reward.starCost,
      newBalance: balance - reward.starCost,
    },
  });
});

export default router;
