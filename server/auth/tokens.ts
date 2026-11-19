import crypto from 'node:crypto';
import argon2 from 'argon2';
import { SignJWT, jwtVerify } from 'jose';
import type { Env } from '../config/env';

export interface AccessClaims {
  sub: string;
  role: 'user' | 'admin';
}

export function hashSecret(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export async function signAccessToken(env: Env, claims: AccessClaims): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifyAccessToken(env: Env, token: string): Promise<AccessClaims> {
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  const { payload } = await jwtVerify(token, secret);
  if (typeof payload.sub !== 'string' || (payload.role !== 'user' && payload.role !== 'admin')) {
    throw new Error('Invalid access token claims');
  }
  return { sub: payload.sub, role: payload.role };
}

export function generateOpaqueToken(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(32).toString('base64url')}`;
}
