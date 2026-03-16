import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  userId: string;
  familyId: string;
  role: string;
  name: string;
  mustChangePassword: boolean;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiresIn });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.jwtRefreshSecret) as JwtPayload;
  } catch {
    return null;
  }
}
