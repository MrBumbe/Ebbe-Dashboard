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

  // Check legacy families.childToken first (backward compat)
  const family = db.select().from(families).where(eq(families.childToken, token)).get();
  if (family) {
    req.familyId = family.id;
    return next();
  }

  // Check children.childToken (per-child tokens added in v1.1)
  const child = db.select().from(children).where(eq(children.childToken, token)).get();
  if (child) {
    req.familyId = child.familyId;
    req.childId = child.id;
    return next();
  }

  return next(new AppError(401, 'UNAUTHORIZED', 'Invalid child token'));
}
