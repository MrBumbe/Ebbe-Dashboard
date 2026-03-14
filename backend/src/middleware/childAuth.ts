import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { families } from '../db/schema';
import { AppError } from './errors';

export interface ChildRequest extends Request {
  familyId?: string;
}

export function requireChildToken(req: ChildRequest, _res: Response, next: NextFunction) {
  const token = req.query.token as string | undefined;
  if (!token) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Missing child token'));
  }
  const db = getDb();
  const family = db.select().from(families).where(eq(families.childToken, token)).get();
  if (!family) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Invalid child token'));
  }
  req.familyId = family.id;
  next();
}
