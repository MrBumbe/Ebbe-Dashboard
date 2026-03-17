import { Router, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../db';
import { childLayouts } from '../db/schema';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { broadcastToFamily } from '../websocket';

const router = Router();
router.use(requireAuth);

const VALID_WIDGETS = [
  'clock', 'weather', 'routine-morning', 'routine-evening', 'routine-custom',
  'week-schedule', 'upcoming-event', 'mood-checkin', 'star-balance', 'timer-display',
];

const DEFAULT_LAYOUT = [
  { pageNumber: 1, widgetId: 'routine-morning',  order: 0, isEnabled: true,  config: '{}' },
  { pageNumber: 1, widgetId: 'routine-evening',  order: 1, isEnabled: true,  config: '{}' },
  { pageNumber: 1, widgetId: 'mood-checkin',     order: 2, isEnabled: true,  config: '{}' },
  { pageNumber: 1, widgetId: 'upcoming-event',   order: 3, isEnabled: true,  config: '{}' },
  { pageNumber: 1, widgetId: 'week-schedule',    order: 4, isEnabled: true,  config: '{}' },
  { pageNumber: 1, widgetId: 'timer-display',    order: 5, isEnabled: false, config: '{}' },
  { pageNumber: 2, widgetId: 'routine-custom',   order: 0, isEnabled: false, config: '{}' },
];

// GET /api/v1/layouts — full layout for a child (or family default)
// ?childId= — the child whose layout to load. Falls back to family default (childId='') if not found.
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const familyId = req.user!.familyId;
  const childId = (req.query.childId as string | undefined) ?? '';

  // Try per-child layout first
  let rows = db.select().from(childLayouts)
    .where(and(eq(childLayouts.familyId, familyId), eq(childLayouts.childId, childId)))
    .all();

  // Fall back to family default (childId = '') when no per-child rows exist
  if (rows.length === 0 && childId !== '') {
    rows = db.select().from(childLayouts)
      .where(and(eq(childLayouts.familyId, familyId), eq(childLayouts.childId, '')))
      .all();
  }

  if (rows.length === 0) {
    return res.json({ data: DEFAULT_LAYOUT.map(e => ({ ...e, familyId, childId })) });
  }

  res.json({ data: rows });
});

// PUT /api/v1/layouts — replace full layout for a child
// Body: array of widget entries + optional childId (defaults to '' = family level)
router.put('/', (req: AuthRequest, res: Response) => {
  const familyId = req.user!.familyId;
  const { childId = '', entries } = req.body as {
    childId?: string;
    entries: Array<{
      pageNumber: number;
      widgetId: string;
      order: number;
      isEnabled: boolean;
      config?: string;
    }>;
  };

  const layoutEntries = Array.isArray(entries) ? entries : (Array.isArray(req.body) ? req.body as typeof entries : null);
  if (!layoutEntries) {
    res.status(400).json({ error: { code: 'INVALID_BODY', message: 'Expected entries array or plain array' } });
    return;
  }

  for (const e of layoutEntries) {
    if (!VALID_WIDGETS.includes(e.widgetId)) {
      res.status(400).json({ error: { code: 'INVALID_WIDGET', message: `Unknown widgetId: ${e.widgetId}` } });
      return;
    }
  }

  const db = getDb();

  // Delete existing layout for this family + childId, then re-insert
  db.delete(childLayouts)
    .where(and(eq(childLayouts.familyId, familyId), eq(childLayouts.childId, childId)))
    .run();

  for (const e of layoutEntries) {
    db.insert(childLayouts).values({
      familyId,
      childId,
      pageNumber: e.pageNumber ?? 1,
      widgetId: e.widgetId,
      order: e.order ?? 0,
      isEnabled: e.isEnabled,
      config: e.config ?? '{}',
    }).run();
  }

  broadcastToFamily(familyId, 'child', { type: 'LAYOUT_UPDATED' });

  res.json({ data: { saved: layoutEntries.length } });
});

// PATCH /api/v1/layouts/:widgetId — update a single widget entry
router.patch('/:widgetId', (req: AuthRequest, res: Response) => {
  const { widgetId } = req.params;
  const familyId = req.user!.familyId;
  const { childId = '', pageNumber = 1, isEnabled, order, config } = req.body as {
    childId?: string;
    pageNumber?: number;
    isEnabled?: boolean;
    order?: number;
    config?: string;
  };

  if (!VALID_WIDGETS.includes(widgetId)) {
    res.status(400).json({ error: { code: 'INVALID_WIDGET', message: `Unknown widgetId: ${widgetId}` } });
    return;
  }

  const db = getDb();

  const existing = db.select().from(childLayouts)
    .where(and(
      eq(childLayouts.familyId, familyId),
      eq(childLayouts.childId, childId),
      eq(childLayouts.pageNumber, pageNumber),
      eq(childLayouts.widgetId, widgetId),
    ))
    .get();

  if (!existing) {
    db.insert(childLayouts).values({
      familyId,
      childId,
      pageNumber,
      widgetId,
      order: order ?? 0,
      isEnabled: isEnabled ?? true,
      config: config ?? '{}',
    }).run();
  } else {
    db.update(childLayouts)
      .set({
        ...(isEnabled !== undefined && { isEnabled }),
        ...(order !== undefined && { order }),
        ...(config !== undefined && { config }),
      })
      .where(and(
        eq(childLayouts.familyId, familyId),
        eq(childLayouts.childId, childId),
        eq(childLayouts.pageNumber, pageNumber),
        eq(childLayouts.widgetId, widgetId),
      ))
      .run();
  }

  broadcastToFamily(familyId, 'child', { type: 'LAYOUT_UPDATED' });

  res.json({ data: { widgetId, updated: true } });
});

export default router;
