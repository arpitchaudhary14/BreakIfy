import argon2 from 'argon2';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, candidate: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, candidate);
  } catch {
    return false;
  }
}

export function generateRandomToken(bytes = 32): { raw: string; hashed: string } {
  const raw = crypto.randomBytes(bytes).toString('hex');
  const hashed = hashToken(raw);
  return { raw, hashed };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export interface JwtAccessPayload {
  userId: string;
  sessionId: string;
  email: string;
}

export interface JwtRefreshPayload {
  userId: string;
  sessionId: string;
}

export function generateAccessToken(payload: JwtAccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
}

export function generateRefreshToken(payload: JwtRefreshPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
}

export interface Jwt2faTempPayload {
  userId: string;
  is2faPending: boolean;
}

export function generateTemp2faToken(userId: string): string {
  return jwt.sign({ userId, is2faPending: true }, env.JWT_ACCESS_SECRET, {
    expiresIn: '5m',
  });
}

export function verifyTemp2faToken(token: string): Jwt2faTempPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as Jwt2faTempPayload;
}


