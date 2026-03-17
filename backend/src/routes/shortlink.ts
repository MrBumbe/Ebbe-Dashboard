/**
 * Short URL redirect — GET /c/:pin
 * Looks up a child by their 4-digit shortPin and redirects to the full child URL.
 */
import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { children } from '../db/schema';

const router = Router();

router.get('/:pin', (req, res) => {
  const { pin } = req.params;
  if (!/^\d{4,6}$/.test(pin)) {
    res.status(404).send('Not found');
    return;
  }
  const db = getDb();
  const child = db.select().from(children).where(eq(children.shortPin, pin)).get();
  if (!child) {
    res.status(404).send('Not found');
    return;
  }
  res.redirect(302, `/child?token=${child.childToken}`);
});

export default router;
