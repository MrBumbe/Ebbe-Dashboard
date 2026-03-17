/**
 * First-run setup endpoints.
 *
 * GET  /api/v1/setup/status  — returns { configured: boolean }
 * POST /api/v1/setup          — creates the initial family + admin account
 *
 * The POST endpoint returns 409 if a family already exists — safe to leave
 * mounted in production.
 */
import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { scryptSync, randomBytes } from 'crypto';
import { getDb } from '../db';
import { families, users, children, childLayouts, settings } from '../db/schema';

const router = Router();

// GET /api/v1/setup/status
router.get('/status', (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.select().from(families).get();
  res.json({ data: { configured: !!existing } });
});

// POST /api/v1/setup
router.post('/', (req: Request, res: Response) => {
  const { familyName, adminName, adminEmail, adminPassword, language } = req.body as {
    familyName?: string;
    adminName?: string;
    adminEmail?: string;
    adminPassword?: string;
    language?: string;
  };

  if (!familyName || !adminEmail || !adminPassword) {
    res.status(400).json({
      error: { code: 'MISSING_FIELDS', message: 'familyName, adminEmail, and adminPassword are required' },
    });
    return;
  }

  if (adminPassword.length < 8) {
    res.status(400).json({
      error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' },
    });
    return;
  }

  const db = getDb();

  // Only allowed when no family exists yet
  const existing = db.select().from(families).get();
  if (existing) {
    res.status(409).json({
      error: { code: 'ALREADY_CONFIGURED', message: 'Ebbe is already set up. Use the parent panel to manage your account.' },
    });
    return;
  }

  const familyId = randomUUID();
  const childToken = randomBytes(24).toString('hex');
  const now = Date.now();

  db.insert(families).values({
    id: familyId,
    name: familyName,
    childToken,
    createdAt: now,
  }).run();

  db.insert(users).values({
    id: randomUUID(),
    familyId,
    name: adminName?.trim() || 'Admin',
    email: adminEmail,
    passwordHash: hashPassword(adminPassword),
    role: 'admin',
    createdAt: now,
  }).run();

  // Create a default child entry using the family's child token
  db.insert(children).values({
    id: randomUUID(),
    familyId,
    name: 'Child',
    emoji: '🧒',
    color: '#1565C0',
    birthdate: null,
    childToken,
    createdAt: now,
  }).run();

  const layoutEntries = [
    { pageNumber: 1, widgetId: 'routine-morning',  order: 0, isEnabled: true,  config: '{}' },
    { pageNumber: 1, widgetId: 'routine-evening',  order: 1, isEnabled: true,  config: '{}' },
    { pageNumber: 1, widgetId: 'mood-checkin',     order: 2, isEnabled: true,  config: '{}' },
    { pageNumber: 1, widgetId: 'upcoming-event',   order: 3, isEnabled: true,  config: '{}' },
    { pageNumber: 1, widgetId: 'week-schedule',    order: 4, isEnabled: true,  config: '{}' },
    { pageNumber: 1, widgetId: 'timer-display',    order: 5, isEnabled: false, config: '{}' },
    { pageNumber: 2, widgetId: 'routine-custom',   order: 0, isEnabled: false, config: '{}' },
  ];
  for (const entry of layoutEntries) {
    db.insert(childLayouts).values({ familyId, ...entry }).run();
  }

  // Seed default settings (language from wizard, defaults to 'en')
  const lang = language === 'sv' ? 'sv' : 'en';
  db.insert(settings).values({ familyId, key: 'family.language', value: JSON.stringify(lang) }).run();

  res.status(201).json({
    data: {
      message: 'Ebbe is ready!',
      childToken,
      loginUrl: '/parent',
    },
  });
});

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export default router;
