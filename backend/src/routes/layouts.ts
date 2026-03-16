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

// GET /api/v1/layouts — full layout config for this family
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const familyId = req.user!.familyId;

  const rows = db.select().from(childLayouts)
    .where(eq(childLayouts.familyId, familyId))
    .all();

  if (rows.length === 0) {
    return res.json({ data: DEFAULT_LAYOUT.map(e => ({ ...e, familyId })) });
  }

  res.json({ data: rows });
});

// PUT /api/v1/layouts — replace full layout (array of widget entries)
router.put('/', (req: AuthRequest, res: Response) => {
  const familyId = req.user!.familyId;
  const entries = req.body as Array<{
    pageNumber: number;
    widgetId: string;
    order: number;
    isEnabled: boolean;
    config?: string;
  }>;

  if (!Array.isArray(entries)) {
    res.status(400).json({ error: { code: 'INVALID_BODY', message: 'Expected array of layout entries' } });
    return;
  }

  for (const e of entries) {
    if (!VALID_WIDGETS.includes(e.widgetId)) {
      res.status(400).json({ error: { code: 'INVALID_WIDGET', message: `Unknown widgetId: ${e.widgetId}` } });
      return;
    }
  }

  const db = getDb();

  // Delete existing layout for this family, then re-insert
  db.delete(childLayouts).where(eq(childLayouts.familyId, familyId)).run();

  for (const e of entries) {
    db.insert(childLayouts).values({
      familyId,
      pageNumber: e.pageNumber ?? 1,
      widgetId: e.widgetId,
      order: e.order ?? 0,
      isEnabled: e.isEnabled,
      config: e.config ?? '{}',
    }).run();
  }

  // Notify child screen to refresh layout
  broadcastToFamily(familyId, 'child', { type: 'LAYOUT_UPDATED' });

  res.json({ data: { saved: entries.length } });
});

// PATCH /api/v1/layouts/:widgetId — update a single widget entry
router.patch('/:widgetId', (req: AuthRequest, res: Response) => {
  const { widgetId } = req.params;
  const familyId = req.user!.familyId;
  const { pageNumber = 1, isEnabled, order, config } = req.body as {
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
      eq(childLayouts.pageNumber, pageNumber),
      eq(childLayouts.widgetId, widgetId),
    ))
    .get();

  if (!existing) {
    // Insert new entry
    db.insert(childLayouts).values({
      familyId,
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
        eq(childLayouts.pageNumber, pageNumber),
        eq(childLayouts.widgetId, widgetId),
      ))
      .run();
  }

  broadcastToFamily(familyId, 'child', { type: 'LAYOUT_UPDATED' });

  res.json({ data: { widgetId, updated: true } });
});

export default router;
