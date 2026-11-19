import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { loadEnv } from '../config/env';
import {
  hashPassword,
  signAccessToken,
  verifyAccessToken,
  verifyPassword,
} from './tokens';

describe('auth tokens', () => {
  it('uses Argon2id for password verification', async () => {
    const hash = await hashPassword('a-long-secure-password');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(hash, 'a-long-secure-password')).toBe(true);
    expect(await verifyPassword(hash, 'wrong-password')).toBe(false);
  });

  it('signs and verifies a short-lived access token', async () => {
    const env = loadEnv({
      NODE_ENV: 'test',
      JWT_ACCESS_SECRET: 'test-access-secret-at-least-32-characters',
      JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-characters',
    });
    const token = await signAccessToken(env, { sub: crypto.randomUUID(), role: 'user' });
    const claims = await verifyAccessToken(env, token);
    expect(claims.role).toBe('user');
  });
});
