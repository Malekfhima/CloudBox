import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { eq, and, isNull, desc, ilike, sql as drizzleSql } from 'drizzle-orm';
import { z } from 'zod';
import { createServer as createViteServer } from 'vite';
import swaggerUi from 'swagger-ui-express';

import { db, sql } from './server/db/client';
import * as schema from './server/db/schema';
import { loadEnv } from './server/config/env';
import {
  generateOpaqueToken,
  hashPassword,
  hashSecret,
  signAccessToken,
  verifyAccessToken,
  verifyPassword,
} from './server/auth/tokens';
import { errorHandler, httpError } from './server/http/errors';
import { ObjectStorage } from './server/storage/object-storage';

const env = loadEnv();
export const app = express();
const storage = new ObjectStorage(env);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024, files: 20 },
});

interface AuthedRequest extends Request {
  authUser?: typeof schema.users.$inferSelect;
}

app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
}));
app.use(cors({
  origin(origin, callback) {
    const allowed = env.ALLOWED_ORIGINS.split(',').map((value) => value.trim());
    const localDevelopmentOrigin =
      env.NODE_ENV !== 'production' &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
    callback(null, !origin || allowed.includes(origin) || localDevelopmentOrigin);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use('/api/v1', rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
}));

const openApi = {
  openapi: '3.0.3',
  info: { title: 'CloudBox API', version: '1.0.0' },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths: {},
};
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openApi));

async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw httpError(401, 'Missing access token', 'UNAUTHORIZED');
    const claims = await verifyAccessToken(env, header.slice(7));
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, claims.sub)).limit(1);
    if (!user) throw httpError(401, 'User no longer exists', 'UNAUTHORIZED');
    if (user.status === 'suspended') throw httpError(403, 'Account suspended', 'FORBIDDEN');
    req.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAdmin(req: AuthedRequest, _res: Response, next: NextFunction) {
  if (req.authUser?.role !== 'admin') {
    next(httpError(403, 'Administrator privileges required', 'FORBIDDEN'));
    return;
  }
  next();
}

async function issueTokens(user: typeof schema.users.$inferSelect, req: Request) {
  const accessToken = await signAccessToken(env, { sub: user.id, role: user.role });
  const refreshToken = generateOpaqueToken('cbrt');
  const familyId = crypto.randomUUID();
  await db.insert(schema.refreshTokens).values({
    userId: user.id,
    tokenHash: hashSecret(refreshToken),
    familyId,
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000),
    ipAddress: req.ip?.slice(0, 45),
    userAgent: req.get('user-agent')?.slice(0, 1000),
  });
  return { accessToken, refreshToken };
}

app.get('/api/v1/health', async (_req, res, next) => {
  try {
    await sql.query('select 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/auth/register', async (req, res, next) => {
  try {
    const body = z.object({
      name: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
      password: z.string().min(12).max(128),
      company: z.string().trim().max(160).optional(),
    }).parse(req.body);
    const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, body.email)).limit(1);
    if (existing) throw httpError(409, 'An account with this email already exists', 'EMAIL_EXISTS');
    const code = String(crypto.randomInt(100000, 1000000));
    const [user] = await db.insert(schema.users).values({
      name: body.name,
      email: body.email,
      passwordHash: await hashPassword(body.password),
      company: body.company,
      verificationCodeHash: hashSecret(code),
    }).returning();
    await db.insert(schema.notifications).values({
      userId: user.id,
      title: 'Welcome to CloudBox',
      message: 'Your workspace is ready. Verify your email to continue.',
      type: 'system',
    });
    res.status(201).json({
      message: 'Account created. Verify the email address.',
      user: { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified },
      verificationCodeHint: env.NODE_ENV === 'development' ? code : undefined,
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/auth/verify-email', async (req, res, next) => {
  try {
    const body = z.object({ email: z.string().email(), code: z.string().regex(/^\d{6}$/) }).parse(req.body);
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, body.email.toLowerCase())).limit(1);
    if (!user) throw httpError(404, 'No account found', 'USER_NOT_FOUND');
    if (!user.emailVerified && (!user.verificationCodeHash || hashSecret(body.code) !== user.verificationCodeHash)) {
      throw httpError(400, 'Invalid verification code', 'INVALID_CODE');
    }
    await db.update(schema.users).set({ emailVerified: true, verificationCodeHash: null }).where(eq(schema.users.id, user.id));
    const updated = { ...user, emailVerified: true };
    res.json({ message: 'Email verified successfully.', ...(await issueTokens(updated, req)), user: updated });
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/auth/login', async (req, res, next) => {
  try {
    const body = z.object({ email: z.string().email(), password: z.string().min(1).max(128) }).parse(req.body);
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, body.email.toLowerCase())).limit(1);
    if (!user || !(await verifyPassword(user.passwordHash, body.password))) {
      throw httpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }
    if (user.status === 'suspended') throw httpError(403, 'Account suspended', 'FORBIDDEN');
    if (!user.emailVerified) throw httpError(403, 'Email verification required', 'EMAIL_NOT_VERIFIED');
    await db.update(schema.users).set({ lastActiveAt: new Date() }).where(eq(schema.users.id, user.id));
    res.json({ ...(await issueTokens(user, req)), user });
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/auth/refresh', async (req, res, next) => {
  try {
    const body = z.object({ refreshToken: z.string().min(20) }).parse(req.body);
    const tokenHash = hashSecret(body.refreshToken);
    const [session] = await db.select().from(schema.refreshTokens).where(eq(schema.refreshTokens.tokenHash, tokenHash)).limit(1);
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw httpError(401, 'Refresh session is invalid or expired', 'INVALID_REFRESH');
    }
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, session.userId)).limit(1);
    if (!user || user.status === 'suspended') throw httpError(401, 'Session is no longer valid', 'INVALID_REFRESH');
    await db.update(schema.refreshTokens).set({ revokedAt: new Date() }).where(eq(schema.refreshTokens.id, session.id));
    res.json(await issueTokens(user, req));
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/auth/forgot-password', async (req, res, next) => {
  try {
    const body = z.object({ email: z.string().email() }).parse(req.body);
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, body.email.toLowerCase())).limit(1);
    if (user) {
      const token = generateOpaqueToken('reset');
      await db.update(schema.users).set({
        resetTokenHash: hashSecret(token),
        resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      }).where(eq(schema.users.id, user.id));
      if (env.NODE_ENV === 'development') {
        res.json({ message: 'If the account exists, a reset link has been sent.', resetTokenHint: token });
        return;
      }
    }
    res.json({ message: 'If the account exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/auth/reset-password', async (req, res, next) => {
  try {
    const body = z.object({ token: z.string().min(20), password: z.string().min(12).max(128) }).parse(req.body);
    const tokenHash = hashSecret(body.token);
    const [user] = await db.select().from(schema.users).where(eq(schema.users.resetTokenHash, tokenHash)).limit(1);
    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt <= new Date()) {
      throw httpError(400, 'Reset token is invalid or expired', 'INVALID_RESET_TOKEN');
    }
    await db.update(schema.users).set({
      passwordHash: await hashPassword(body.password),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    }).where(eq(schema.users.id, user.id));
    await db.update(schema.refreshTokens).set({ revokedAt: new Date() }).where(eq(schema.refreshTokens.userId, user.id));
    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/auth/logout', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({ refreshToken: z.string().optional() }).parse(req.body);
    if (body.refreshToken) {
      await db.update(schema.refreshTokens)
        .set({ revokedAt: new Date() })
        .where(and(eq(schema.refreshTokens.userId, req.authUser!.id), eq(schema.refreshTokens.tokenHash, hashSecret(body.refreshToken))));
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get('/api/v1/auth/me', requireAuth, (req: AuthedRequest, res) => res.json({ user: req.authUser }));

app.get('/api/v1/storage/usage', requireAuth, (req: AuthedRequest, res) => res.json({
  usedBytes: req.authUser!.storageUsedBytes,
  quotaBytes: req.authUser!.storageQuotaBytes,
  percentUsed: req.authUser!.storageQuotaBytes === 0 ? 0 : Number(((req.authUser!.storageUsedBytes / req.authUser!.storageQuotaBytes) * 100).toFixed(2)),
}));

app.get('/api/v1/files', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const query = z.object({
      folderId: z.string().uuid().nullable().optional(),
      search: z.string().trim().max(100).optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(50),
    }).parse({ ...req.query, folderId: req.query.folderId === 'null' ? null : req.query.folderId });
    const conditions = [eq(schema.files.ownerId, req.authUser!.id), isNull(schema.files.deletedAt)];
    if (query.folderId) conditions.push(eq(schema.files.folderId, query.folderId));
    else if (req.query.folderId === 'null') conditions.push(isNull(schema.files.folderId));
    if (query.search) conditions.push(ilike(schema.files.name, `%${query.search}%`));
    const rows = await db.select().from(schema.files).where(and(...conditions)).orderBy(desc(schema.files.updatedAt)).limit(query.limit).offset((query.page - 1) * query.limit);
    res.json({ files: rows, total: rows.length, page: query.page, limit: query.limit });
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/files/upload', requireAuth, upload.array('files', 20), async (req: AuthedRequest, res, next) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) throw httpError(400, 'At least one file is required', 'NO_FILES');
    const folderId = req.body.folderId === 'null' ? null : z.string().uuid().optional().parse(req.body.folderId);
    if (folderId) {
      const [folder] = await db.select({ id: schema.folders.id }).from(schema.folders).where(and(eq(schema.folders.id, folderId), eq(schema.folders.ownerId, req.authUser!.id))).limit(1);
      if (!folder) throw httpError(404, 'Folder not found', 'NOT_FOUND');
    }
    const inserted = [];
    for (const file of files) {
      const name = z.string().trim().min(1).max(255).parse(file.originalname);
      if (file.size > env.MAX_UPLOAD_SIZE_MB * 1024 * 1024) throw httpError(413, 'File exceeds upload limit', 'FILE_TOO_LARGE');
      const mime = z.string().max(255).parse(file.mimetype || 'application/octet-stream');
      const objectKey = storage.createObjectKey(req.authUser!.id, name);
      await db.transaction(async (tx) => {
        const reservation = await tx.execute(drizzleSql`
          UPDATE users SET storage_used_bytes = storage_used_bytes + ${file.size},
                           updated_at = now()
          WHERE id = ${req.authUser!.id}
            AND storage_used_bytes + ${file.size} <= storage_quota_bytes
          RETURNING id
        `);
        const reserved = 'rows' in reservation ? reservation.rows[0] : reservation[0];
        if (!reserved) throw httpError(413, 'Storage quota exceeded', 'QUOTA_EXCEEDED');
        await tx.insert(schema.files).values({
          ownerId: req.authUser!.id,
          folderId,
          name,
          mimeType: mime,
          category: classifyMime(mime, name),
          sizeBytes: file.size,
          objectKey,
          checksumSha256: crypto.createHash('sha256').update(file.buffer).digest('hex'),
        }).returning();
      });
      await storage.uploadObject(objectKey, file.buffer, mime);
      const [created] = await db.select().from(schema.files).where(eq(schema.files.objectKey, objectKey)).limit(1);
      inserted.push(created);
    }
    res.status(201).json({ files: inserted });
  } catch (error) {
    next(error);
  }
});

function classifyMime(mime: string, name: string): typeof schema.fileCategoryEnum.enumValues[number] {
  const ext = name.split('.').pop()?.toLowerCase();
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext || '')) return 'image';
  if (mime.startsWith('video/') || ['mp4', 'mov', 'webm', 'mkv'].includes(ext || '')) return 'video';
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'aac', 'flac', 'ogg'].includes(ext || '')) return 'audio';
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext || '')) return 'archive';
  if (['ts', 'tsx', 'js', 'jsx', 'json', 'css', 'html', 'py', 'sql'].includes(ext || '')) return 'code';
  if (mime === 'application/pdf' || ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'txt', 'md', 'csv'].includes(ext || '')) return 'document';
  return 'other';
}

app.get('/api/v1/files/:id/download', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const [file] = await db.select().from(schema.files).where(and(eq(schema.files.id, req.params.id), eq(schema.files.ownerId, req.authUser!.id), isNull(schema.files.deletedAt))).limit(1);
    if (!file) throw httpError(404, 'File not found', 'NOT_FOUND');
    const body = await storage.downloadObject(file.objectKey);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    res.send(Buffer.from(body));
  } catch (error) {
    next(error);
  }
});

app.patch('/api/v1/files/:id', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({
      name: z.string().trim().min(1).max(255).optional(),
      folderId: z.string().uuid().nullable().optional(),
      isFavorite: z.boolean().optional(),
    }).parse(req.body);
    const [file] = await db.select().from(schema.files).where(and(eq(schema.files.id, req.params.id), eq(schema.files.ownerId, req.authUser!.id))).limit(1);
    if (!file) throw httpError(404, 'File not found', 'NOT_FOUND');
    if (body.folderId) {
      const [folder] = await db.select({ id: schema.folders.id }).from(schema.folders).where(and(eq(schema.folders.id, body.folderId), eq(schema.folders.ownerId, req.authUser!.id))).limit(1);
      if (!folder) throw httpError(404, 'Target folder not found', 'NOT_FOUND');
    }
    const [updated] = await db.update(schema.files).set({ ...body, updatedAt: new Date() }).where(eq(schema.files.id, file.id)).returning();
    res.json({ file: updated });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/v1/files/:id', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const permanent = req.query.permanent === 'true';
    const [file] = await db.select().from(schema.files).where(and(eq(schema.files.id, req.params.id), eq(schema.files.ownerId, req.authUser!.id))).limit(1);
    if (!file) throw httpError(404, 'File not found', 'NOT_FOUND');
    if (permanent) {
      await storage.deleteObject(file.objectKey);
      await db.delete(schema.files).where(eq(schema.files.id, file.id));
      await db.update(schema.users).set({ storageUsedBytes: drizzleSql`GREATEST(storage_used_bytes - ${file.sizeBytes}, 0)` }).where(eq(schema.users.id, req.authUser!.id));
    } else {
      await db.update(schema.files).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(schema.files.id, file.id));
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/files/:id/restore', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const [updated] = await db.update(schema.files).set({ deletedAt: null, updatedAt: new Date() }).where(and(eq(schema.files.id, req.params.id), eq(schema.files.ownerId, req.authUser!.id))).returning();
    if (!updated) throw httpError(404, 'File not found', 'NOT_FOUND');
    res.json({ file: updated });
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/files/:id/copy', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({ targetFolderId: z.string().uuid().nullable().optional() }).parse(req.body);
    const [file] = await db.select().from(schema.files).where(and(eq(schema.files.id, req.params.id), eq(schema.files.ownerId, req.authUser!.id), isNull(schema.files.deletedAt))).limit(1);
    if (!file) throw httpError(404, 'File not found', 'NOT_FOUND');
    if (body.targetFolderId) {
      const [folder] = await db.select({ id: schema.folders.id }).from(schema.folders).where(and(eq(schema.folders.id, body.targetFolderId), eq(schema.folders.ownerId, req.authUser!.id))).limit(1);
      if (!folder) throw httpError(404, 'Target folder not found', 'NOT_FOUND');
    }
    const copiedKey = storage.createObjectKey(req.authUser!.id, file.name);
    const bodyBytes = await storage.downloadObject(file.objectKey);
    await storage.uploadObject(copiedKey, bodyBytes, file.mimeType);
    await db.transaction(async (tx) => {
      const reservation = await tx.execute(drizzleSql`
        UPDATE users SET storage_used_bytes = storage_used_bytes + ${file.sizeBytes}, updated_at = now()
        WHERE id = ${req.authUser!.id}
          AND storage_used_bytes + ${file.sizeBytes} <= storage_quota_bytes
        RETURNING id
      `);
      const reserved = 'rows' in reservation ? reservation.rows[0] : reservation[0];
      if (!reserved) throw httpError(413, 'Storage quota exceeded', 'QUOTA_EXCEEDED');
      await tx.insert(schema.files).values({
        ownerId: req.authUser!.id,
        folderId: body.targetFolderId ?? null,
        name: file.name,
        mimeType: file.mimeType,
        category: file.category,
        sizeBytes: file.sizeBytes,
        objectKey: copiedKey,
        checksumSha256: file.checksumSha256,
      });
    });
    const [copied] = await db.select().from(schema.files).where(eq(schema.files.objectKey, copiedKey)).limit(1);
    res.status(201).json({ file: copied });
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/files/bulk', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({
      ids: z.array(z.string().uuid()).min(1).max(100),
      folderIds: z.array(z.string().uuid()).optional(),
      action: z.enum(['delete', 'permanent-delete', 'restore', 'move', 'favorite', 'unfavorite']),
      targetFolderId: z.string().uuid().nullable().optional(),
    }).parse(req.body);
    if (body.action === 'move' && body.targetFolderId) {
      const [folder] = await db.select({ id: schema.folders.id }).from(schema.folders).where(and(eq(schema.folders.id, body.targetFolderId), eq(schema.folders.ownerId, req.authUser!.id))).limit(1);
      if (!folder) throw httpError(404, 'Target folder not found', 'NOT_FOUND');
    }
    let affected = 0;
    for (const id of body.ids) {
      const [file] = await db.select().from(schema.files).where(and(eq(schema.files.id, id), eq(schema.files.ownerId, req.authUser!.id))).limit(1);
      if (!file) continue;
      if (body.action === 'delete') {
        await db.update(schema.files).set({ deletedAt: new Date() }).where(eq(schema.files.id, id));
      } else if (body.action === 'restore') {
        await db.update(schema.files).set({ deletedAt: null }).where(eq(schema.files.id, id));
      } else if (body.action === 'move') {
        await db.update(schema.files).set({ folderId: body.targetFolderId ?? null }).where(eq(schema.files.id, id));
      } else if (body.action === 'favorite' || body.action === 'unfavorite') {
        await db.update(schema.files).set({ isFavorite: body.action === 'favorite' }).where(eq(schema.files.id, id));
      } else if (body.action === 'permanent-delete') {
        await storage.deleteObject(file.objectKey);
        await db.delete(schema.files).where(eq(schema.files.id, id));
        await db.update(schema.users).set({ storageUsedBytes: drizzleSql`GREATEST(storage_used_bytes - ${file.sizeBytes}, 0)` }).where(eq(schema.users.id, req.authUser!.id));
      }
      affected += 1;
    }
    res.json({ affected });
  } catch (error) {
    next(error);
  }
});

app.get('/api/v1/folders', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const rows = await db.select().from(schema.folders).where(and(eq(schema.folders.ownerId, req.authUser!.id), isNull(schema.folders.deletedAt))).orderBy(schema.folders.name);
    res.json({ folders: rows });
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/folders', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({ name: z.string().trim().min(1).max(255), parentId: z.string().uuid().nullable().optional() }).parse(req.body);
    if (body.parentId) {
      const [parent] = await db.select({ id: schema.folders.id }).from(schema.folders).where(and(eq(schema.folders.id, body.parentId), eq(schema.folders.ownerId, req.authUser!.id))).limit(1);
      if (!parent) throw httpError(404, 'Parent folder not found', 'NOT_FOUND');
    }
    const [folder] = await db.insert(schema.folders).values({ ownerId: req.authUser!.id, name: body.name, parentId: body.parentId }).returning();
    res.status(201).json({ folder });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/v1/folders/:id', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({ name: z.string().trim().min(1).max(255).optional(), parentId: z.string().uuid().nullable().optional(), isFavorite: z.boolean().optional() }).parse(req.body);
    const [folder] = await db.select().from(schema.folders).where(and(eq(schema.folders.id, req.params.id), eq(schema.folders.ownerId, req.authUser!.id))).limit(1);
    if (!folder) throw httpError(404, 'Folder not found', 'NOT_FOUND');
    if (body.parentId) {
      if (body.parentId === folder.id) throw httpError(400, 'A folder cannot contain itself', 'CIRCULAR_FOLDER');
      let ancestorId: string | null = body.parentId;
      const visited = new Set<string>();
      while (ancestorId) {
        if (visited.has(ancestorId) || ancestorId === folder.id) throw httpError(400, 'Circular folder reference', 'CIRCULAR_FOLDER');
        visited.add(ancestorId);
        const [ancestor] = await db.select({ id: schema.folders.id, parentId: schema.folders.parentId, ownerId: schema.folders.ownerId }).from(schema.folders).where(eq(schema.folders.id, ancestorId)).limit(1);
        if (!ancestor || ancestor.ownerId !== req.authUser!.id) throw httpError(404, 'Target folder not found', 'NOT_FOUND');
        ancestorId = ancestor.parentId;
      }
    }
    const [updated] = await db.update(schema.folders).set({ ...body, updatedAt: new Date() }).where(eq(schema.folders.id, folder.id)).returning();
    res.json({ folder: updated });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/v1/folders/:id', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const [folder] = await db.select().from(schema.folders).where(and(eq(schema.folders.id, req.params.id), eq(schema.folders.ownerId, req.authUser!.id))).limit(1);
    if (!folder) throw httpError(404, 'Folder not found', 'NOT_FOUND');
    if (req.query.permanent === 'true') {
      await db.update(schema.files).set({ folderId: null }).where(eq(schema.files.folderId, folder.id));
      await db.delete(schema.folders).where(eq(schema.folders.id, folder.id));
    } else {
      await db.update(schema.folders).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(schema.folders.id, folder.id));
      await db.update(schema.files).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(schema.files.folderId, folder.id));
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/folders/:id/restore', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const [folder] = await db.update(schema.folders).set({ deletedAt: null, updatedAt: new Date() }).where(and(eq(schema.folders.id, req.params.id), eq(schema.folders.ownerId, req.authUser!.id))).returning();
    if (!folder) throw httpError(404, 'Folder not found', 'NOT_FOUND');
    await db.update(schema.files).set({ deletedAt: null, updatedAt: new Date() }).where(eq(schema.files.folderId, folder.id));
    res.json({ folder });
  } catch (error) {
    next(error);
  }
});

app.get('/api/v1/notifications', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const rows = await db.select().from(schema.notifications).where(eq(schema.notifications.userId, req.authUser!.id)).orderBy(desc(schema.notifications.createdAt)).limit(100);
    res.json({ notifications: rows });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/v1/notifications/:id/read', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const [row] = await db.update(schema.notifications).set({ isRead: true }).where(and(eq(schema.notifications.id, req.params.id), eq(schema.notifications.userId, req.authUser!.id))).returning();
    if (!row) throw httpError(404, 'Notification not found', 'NOT_FOUND');
    res.json({ notification: row });
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/notifications/read-all', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    await db.update(schema.notifications).set({ isRead: true }).where(eq(schema.notifications.userId, req.authUser!.id));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/v1/files/:id/shares', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const [file] = await db.select().from(schema.files).where(and(eq(schema.files.id, req.params.id), eq(schema.files.ownerId, req.authUser!.id))).limit(1);
    if (!file) throw httpError(404, 'File not found', 'NOT_FOUND');
    const rows = await db.select().from(schema.shares).where(and(eq(schema.shares.fileId, file.id), eq(schema.shares.ownerId, req.authUser!.id)));
    const [link] = await db.select().from(schema.shareLinks).where(and(eq(schema.shareLinks.fileId, file.id), eq(schema.shareLinks.ownerId, req.authUser!.id)));
    res.json({ shares: rows, publicLinkEnabled: Boolean(link && !link.revokedAt), publicLinkToken: null, publicLinkPermission: link?.permission ?? 'viewer', publicLinkExpiresAt: link?.expiresAt ?? null });
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/files/:id/shares', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({
      email: z.string().email().optional(),
      permission: z.enum(['viewer', 'editor']).optional(),
      publicLinkEnabled: z.boolean().optional(),
      publicLinkPermission: z.enum(['viewer', 'editor']).optional(),
      publicLinkExpiresAt: z.string().datetime().nullable().optional(),
    }).parse(req.body);
    const [file] = await db.select().from(schema.files).where(and(eq(schema.files.id, req.params.id), eq(schema.files.ownerId, req.authUser!.id))).limit(1);
    if (!file) throw httpError(404, 'File not found', 'NOT_FOUND');
    if (body.email) {
      await db.insert(schema.shares).values({
        fileId: file.id,
        ownerId: req.authUser!.id,
        granteeEmail: body.email.toLowerCase(),
        permission: body.permission ?? 'viewer',
      });
    }
    if (body.publicLinkEnabled !== undefined) {
      const [existing] = await db.select().from(schema.shareLinks).where(and(eq(schema.shareLinks.fileId, file.id), eq(schema.shareLinks.ownerId, req.authUser!.id))).limit(1);
      if (body.publicLinkEnabled) {
        const token = generateOpaqueToken('share');
        if (existing) {
          await db.update(schema.shareLinks).set({ tokenHash: hashSecret(token), permission: body.publicLinkPermission ?? 'viewer', expiresAt: body.publicLinkExpiresAt ? new Date(body.publicLinkExpiresAt) : null, revokedAt: null }).where(eq(schema.shareLinks.id, existing.id));
        } else {
          await db.insert(schema.shareLinks).values({ fileId: file.id, ownerId: req.authUser!.id, tokenHash: hashSecret(token), permission: body.publicLinkPermission ?? 'viewer', expiresAt: body.publicLinkExpiresAt ? new Date(body.publicLinkExpiresAt) : null });
        }
      } else if (existing) {
        await db.update(schema.shareLinks).set({ revokedAt: new Date() }).where(eq(schema.shareLinks.id, existing.id));
      }
    }
    res.json({ file });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/v1/files/:id/shares/:shareId', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const [deleted] = await db.delete(schema.shares).where(and(eq(schema.shares.id, req.params.shareId), eq(schema.shares.fileId, req.params.id), eq(schema.shares.ownerId, req.authUser!.id))).returning();
    if (!deleted) throw httpError(404, 'Share not found', 'NOT_FOUND');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use('/api/v1', errorHandler);

async function startServer() {
  if (env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }
  app.listen(env.PORT, '0.0.0.0', () => console.log(`CloudBox server running on port ${env.PORT}`));
}

const entryFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === entryFile) {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
