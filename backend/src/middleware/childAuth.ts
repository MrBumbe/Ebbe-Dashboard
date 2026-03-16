import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { families, children } from '../db/schema';
import { AppError } from './errors';

export interface ChildRequest extends Request {
  familyId?: string;
  childId?: string; // set when token matched via children table (not legacy family token)
}

export function requireChildToken(req: ChildRequest, _res: Response, next: NextFunction) {
  const token = req.query.token as string | undefined;
  if (!token) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Missing child token'));
  }
  const db = getDb();

  // Check children.childToken FIRST — covers both per-child tokens and the legacy
  // token that db/index.ts migrated into the children table on startup.
  // This ensures req.childId is always set when a known child token is used.
  const child = db.select().from(children).where(eq(children.childToken, token)).get();
  if (child) {
    req.familyId = child.familyId;
    req.childId = child.id;
    return next();
  }

  // Fall back to legacy families.childToken for installs where the children
  // table entry hasn't been created yet (edge case; startup fixup covers this).
  const family = db.select().from(families).where(eq(families.childToken, token)).get();
  if (family) {
    req.familyId = family.id;
    return next();
  }

  return next(new AppError(401, 'UNAUTHORIZED', 'Invalid child token'));
}
