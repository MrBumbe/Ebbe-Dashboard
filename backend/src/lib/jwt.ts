import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getJwtSecret, getJwtRefreshSecret } from './secrets';

export interface JwtPayload {
  userId: string;
  familyId: string;
  role: string;
  name: string;
  mustChangePassword: boolean;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: config.jwtExpiresIn });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtRefreshSecret(), { expiresIn: config.jwtRefreshExpiresIn });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getJwtRefreshSecret()) as JwtPayload;
  } catch {
    return null;
  }
}
