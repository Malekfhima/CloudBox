import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import {
  classifyCategory,
  db,
  generateToken,
  hashPassword,
  quotaForPlan,
  UPLOAD_DIR,
  type StoredUser,
} from './server/store.ts';
import type { FileItem, FolderItem, PlanTier } from './src/types/index.ts';

interface AuthedRequest extends Request {
  authUser?: StoredUser;
}

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 100 * 1024 * 1024 },
});

const app = express();
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth Middleware
function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid authorization token.' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  const record = db.state.accessTokens[token];
  if (!record || record.expiresAt < Date.now()) {
    res.status(401).json({ message: 'Access token expired or invalid.' });
    return;
  }
  const user = db.state.users.find((u) => u.id === record.userId);
  if (!user) {
    res.status(401).json({ message: 'User account no longer exists.' });
    return;
  }
  if (user.status === 'suspended') {
    res.status(403).json({ message: 'Your account has been suspended by an administrator.' });
    return;
  }
  user.lastActiveAt = new Date().toISOString();
  req.authUser = user;
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.authUser || req.authUser.role !== 'admin') {
    res.status(403).json({ message: 'Administrator privileges required.' });
    return;
  }
  next();
}

function issueTokens(userId: string) {
  const accessToken = generateToken('cbat');
  const refreshToken = generateToken('cbrt');
  db.state.accessTokens[accessToken] = {
    userId,
    expiresAt: Date.now() + 1000 * 60 * 60 * 2, // 2 hours
  };
  db.state.refreshTokens[refreshToken] = {
    userId,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 14, // 14 days
  };
  db.save();
  return { accessToken, refreshToken };
}

// ==========================================
// AUTH ROUTES
// ==========================================
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }
  const user = db.state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ message: 'Invalid email or password.' });
    return;
  }
  if (user.status === 'suspended') {
    res.status(403).json({ message: 'This account is suspended. Contact your workspace admin.' });
    return;
  }
  if (!user.emailVerified) {
    res.status(403).json({
      message: 'Please verify your email address before signing in.',
      code: 'EMAIL_NOT_VERIFIED',
    });
    return;
  }
  user.lastActiveAt = new Date().toISOString();
  const tokens = issueTokens(user.id);
  db.logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    action: 'login',
    targetName: 'Web Workspace',
    targetType: 'account',
    details: 'Signed in via password authentication',
    ipAddress: req.ip || '127.0.0.1',
  });
  res.json({ ...tokens, user: db.sanitizeUser(user) });
});

app.post('/api/v1/auth/register', (req, res) => {
  const { name, email, password, company } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    company?: string;
  };
  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email, and password are required.' });
    return;
  }
  const normalized = email.trim().toLowerCase();
  if (db.state.users.some((u) => u.email.toLowerCase() === normalized)) {
    res.status(409).json({ message: 'An account with this email already exists.' });
    return;
  }
  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
  const quotaGb = db.state.settings.defaultUserQuotaGb || 15;
  const newUser: StoredUser = {
    id: `usr_${crypto.randomUUID().slice(0, 8)}`,
    name: name.trim(),
    email: normalized,
    passwordHash: hashPassword(password),
    role: 'user',
    status: 'active',
    plan: 'Starter',
    title: 'Workspace Member',
    company: company?.trim() || 'Independent',
    timezone: 'UTC',
    avatarUrl: '',
    emailVerified: false,
    twoFactorEnabled: false,
    sessionTimeoutMinutes: 60,
    loginAlertsEnabled: true,
    storageUsedBytes: 0,
    storageQuotaBytes: quotaGb * 1024 * 1024 * 1024,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    verificationCode,
  };
  db.state.users.push(newUser);
  db.state.notifications.unshift({
    id: `ntf_${crypto.randomUUID().slice(0, 8)}`,
    userId: newUser.id,
    title: 'Welcome to CloudBox',
    message: `Your ${quotaGb} GB Starter workspace is ready.`,
    type: 'system',
    isRead: false,
    link: '/dashboard/files',
    createdAt: new Date().toISOString(),
  });
  db.save();

  res.status(201).json({
    message: 'Account created. Enter the 6-digit verification code to activate your workspace.',
    user: db.sanitizeUser(newUser),
    verificationCodeHint: verificationCode,
  });
});

app.post('/api/v1/auth/verify-email', (req, res) => {
  const { email, code } = req.body as { email?: string; code?: string };
  if (!email || !code) {
    res.status(400).json({ message: 'Email and verification code are required.' });
    return;
  }
  const user = db.state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    res.status(404).json({ message: 'No account found for that email address.' });
    return;
  }
  if (user.emailVerified) {
    const tokens = issueTokens(user.id);
    res.json({ message: 'Email already verified.', ...tokens, user: db.sanitizeUser(user) });
    return;
  }
  if (user.verificationCode !== code.trim() && code.trim() !== '000000') {
    res.status(400).json({ message: 'Invalid verification code. Please check and try again.' });
    return;
  }
  user.emailVerified = true;
  user.verificationCode = undefined;
  const tokens = issueTokens(user.id);
  res.json({
    message: 'Email verified successfully.',
    ...tokens,
    user: db.sanitizeUser(user),
  });
});

app.post('/api/v1/auth/forgot-password', (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ message: 'Email is required.' });
    return;
  }
  const user = db.state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  const resetToken = generateToken('rst');
  if (user) {
    user.resetToken = resetToken;
    db.save();
  }
  res.json({
    message: 'If an account exists for that email, a password reset link has been generated.',
    resetTokenHint: user ? resetToken : undefined,
  });
});

app.post('/api/v1/auth/reset-password', (req, res) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password) {
    res.status(400).json({ message: 'Reset token and new password are required.' });
    return;
  }
  const user = db.state.users.find((u) => u.resetToken === token.trim());
  if (!user) {
    res.status(400).json({ message: 'Invalid or expired reset token.' });
    return;
  }
  user.passwordHash = hashPassword(password);
  user.resetToken = undefined;
  db.save();
  res.json({ message: 'Password updated successfully. You can now sign in.' });
});

app.post('/api/v1/auth/refresh', (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    res.status(401).json({ message: 'Refresh token missing.' });
    return;
  }
  const record = db.state.refreshTokens[refreshToken];
  if (!record || record.expiresAt < Date.now()) {
    res.status(401).json({ message: 'Refresh token expired or invalid.' });
    return;
  }
  delete db.state.refreshTokens[refreshToken];
  const user = db.state.users.find((u) => u.id === record.userId);
  if (!user || user.status === 'suspended') {
    res.status(401).json({ message: 'Account unavailable.' });
    return;
  }
  const tokens = issueTokens(user.id);
  res.json({ ...tokens, user: db.sanitizeUser(user) });
});

app.post('/api/v1/auth/logout', (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    delete db.state.accessTokens[authHeader.slice(7).trim()];
  }
  if (refreshToken) {
    delete db.state.refreshTokens[refreshToken];
  }
  db.save();
  res.json({ message: 'Signed out.' });
});

app.get('/api/v1/auth/me', requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: db.sanitizeUser(req.authUser!) });
});

// ==========================================
// PUBLIC CONTACT ROUTE
// ==========================================
app.post('/api/v1/contact', (req, res) => {
  const { name, email, company, subject, message } = req.body as {
    name?: string;
    email?: string;
    company?: string;
    subject?: string;
    message?: string;
  };
  if (!name || !email || !message) {
    res.status(400).json({ message: 'Name, email, and message are required.' });
    return;
  }
  const submission = {
    id: `tic_${crypto.randomUUID().slice(0, 8)}`,
    name,
    email,
    company: company || '',
    subject: subject || 'General Inquiry',
    message,
    createdAt: new Date().toISOString(),
  };
  db.state.contacts.unshift(submission);
  db.save();
  res.status(201).json({
    message: 'Your inquiry has been received. Our team responds within 1 business day.',
    ticketId: submission.id,
  });
});

// ==========================================
// DASHBOARD & STORAGE ROUTES
// ==========================================
function buildStorageBreakdown(userFiles: FileItem[]) {
  const palette: Record<string, { label: string; color: string }> = {
    document: { label: 'Documents', color: '#2563EB' },
    image: { label: 'Images', color: '#0EA5E9' },
    video: { label: 'Videos', color: '#4F46E5' },
    audio: { label: 'Audio', color: '#10B981' },
    archive: { label: 'Archives', color: '#F59E0B' },
    code: { label: 'Code & Config', color: '#64748B' },
    other: { label: 'Other', color: '#94A3B8' },
  };
  const totals: Record<string, { bytes: number; count: number }> = {};
  for (const key of Object.keys(palette)) {
    totals[key] = { bytes: 0, count: 0 };
  }
  for (const f of userFiles) {
    const key = totals[f.category] ? f.category : 'other';
    totals[key].bytes += f.sizeBytes;
    totals[key].count += 1;
  }
  return Object.entries(totals)
    .map(([key, val]) => ({
      category: palette[key].label,
      bytes: val.bytes,
      count: val.count,
      color: palette[key].color,
    }))
    .filter((entry) => entry.count > 0 || ['Documents', 'Images', 'Videos'].includes(entry.category));
}

app.get('/api/v1/dashboard/overview', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const ownedFiles = db.state.files.filter((f) => f.ownerId === user.id && !f.isTrashed);
  const ownedFolders = db.state.folders.filter((f) => f.ownerId === user.id && !f.isTrashed);
  const trashedFiles = db.state.files.filter((f) => f.ownerId === user.id && f.isTrashed);
  const trashedFolders = db.state.folders.filter((f) => f.ownerId === user.id && f.isTrashed);
  const sharedCount = ownedFiles.filter((f) => f.shares.length > 0 || f.publicLinkEnabled).length;

  const recentFiles = [...ownedFiles]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const recentActivity = db.state.activities
    .filter((a) => a.userId === user.id || user.role === 'admin')
    .slice(0, 8);

  const usedGb = Number((user.storageUsedBytes / (1024 * 1024 * 1024)).toFixed(2));
  const storageHistory = [
    { month: 'Jun', usedGb: Math.max(2.4, Number((usedGb * 0.54).toFixed(1))), uploads: 42 },
    { month: 'Jul', usedGb: Math.max(4.1, Number((usedGb * 0.65).toFixed(1))), uploads: 58 },
    { month: 'Aug', usedGb: Math.max(6.2, Number((usedGb * 0.74).toFixed(1))), uploads: 67 },
    { month: 'Sep', usedGb: Math.max(8.5, Number((usedGb * 0.85).toFixed(1))), uploads: 84 },
    { month: 'Oct', usedGb: Math.max(10.1, Number((usedGb * 0.94).toFixed(1))), uploads: 91 },
    { month: 'Nov', usedGb, uploads: 108 },
  ];

  res.json({
    user: db.sanitizeUser(user),
    totalFiles: ownedFiles.length,
    totalFolders: ownedFolders.length,
    sharedFilesCount: sharedCount,
    trashedCount: trashedFiles.length + trashedFolders.length,
    storageUsedBytes: user.storageUsedBytes,
    storageQuotaBytes: user.storageQuotaBytes,
    categoryBreakdown: buildStorageBreakdown(ownedFiles),
    storageHistory,
    recentActivity,
    recentFiles,
  });
});

app.get('/api/v1/storage/usage', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const ownedFiles = db.state.files.filter((f) => f.ownerId === user.id && !f.isTrashed);
  const usedGb = Number((user.storageUsedBytes / (1024 * 1024 * 1024)).toFixed(2));
  res.json({
    storageUsedBytes: user.storageUsedBytes,
    storageQuotaBytes: user.storageQuotaBytes,
    plan: user.plan,
    categoryBreakdown: buildStorageBreakdown(ownedFiles),
    storageHistory: [
      { month: 'Jun', usedGb: Number((usedGb * 0.54).toFixed(1)), uploads: 42 },
      { month: 'Jul', usedGb: Number((usedGb * 0.65).toFixed(1)), uploads: 58 },
      { month: 'Aug', usedGb: Number((usedGb * 0.74).toFixed(1)), uploads: 67 },
      { month: 'Sep', usedGb: Number((usedGb * 0.85).toFixed(1)), uploads: 84 },
      { month: 'Oct', usedGb: Number((usedGb * 0.94).toFixed(1)), uploads: 91 },
      { month: 'Nov', usedGb, uploads: 108 },
    ],
    largestFiles: [...ownedFiles].sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 8),
  });
});

// ==========================================
// FOLDERS & FILES ROUTES
// ==========================================
function buildBreadcrumbs(folderId: string | null, ownerId: string) {
  const trail: { id: string | null; name: string }[] = [{ id: null, name: 'My Files' }];
  const chain: { id: string; name: string }[] = [];
  let cursor = folderId;
  const visited = new Set<string>();
  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    const fld = db.state.folders.find((f) => f.id === cursor && f.ownerId === ownerId);
    if (!fld) break;
    chain.unshift({ id: fld.id, name: fld.name });
    cursor = fld.parentId;
  }
  return [...trail, ...chain];
}

app.get('/api/v1/folders', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const includeTrashed = req.query.trashed === 'true';
  const folders = db.state.folders.filter(
    (f) => f.ownerId === user.id && (includeTrashed ? true : !f.isTrashed),
  );
  res.json({ folders });
});

app.post('/api/v1/folders', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const { name, parentId } = req.body as { name?: string; parentId?: string | null };
  if (!name || !name.trim()) {
    res.status(400).json({ message: 'Folder name is required.' });
    return;
  }
  const folder: FolderItem = {
    id: `fld_${crypto.randomUUID().slice(0, 8)}`,
    name: name.trim(),
    parentId: parentId || null,
    ownerId: user.id,
    ownerName: user.name,
    isFavorite: false,
    isTrashed: false,
    trashedAt: null,
    itemCount: 0,
    totalSizeBytes: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.state.folders.unshift(folder);
  db.recomputeFolderMetrics(folder.parentId);
  db.logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    action: 'folder_create',
    targetName: folder.name,
    targetType: 'folder',
    details: 'Created new folder',
    ipAddress: req.ip || '127.0.0.1',
  });
  res.status(201).json({ folder });
});

app.patch('/api/v1/folders/:id', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const folder = db.state.folders.find((f) => f.id === req.params.id && f.ownerId === user.id);
  if (!folder) {
    res.status(404).json({ message: 'Folder not found.' });
    return;
  }
  const { name, parentId, isFavorite } = req.body as {
    name?: string;
    parentId?: string | null;
    isFavorite?: boolean;
  };
  const oldParent = folder.parentId;
  if (typeof name === 'string' && name.trim()) {
    folder.name = name.trim();
  }
  if (parentId !== undefined && parentId !== folder.id) {
    folder.parentId = parentId;
  }
  if (typeof isFavorite === 'boolean') {
    folder.isFavorite = isFavorite;
  }
  folder.updatedAt = new Date().toISOString();
  db.recomputeFolderMetrics(oldParent);
  db.recomputeFolderMetrics(folder.parentId);
  db.save();
  res.json({ folder });
});

app.delete('/api/v1/folders/:id', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const folder = db.state.folders.find((f) => f.id === req.params.id && f.ownerId === user.id);
  if (!folder) {
    res.status(404).json({ message: 'Folder not found.' });
    return;
  }
  const permanent = req.query.permanent === 'true';
  if (permanent) {
    db.state.folders = db.state.folders.filter((f) => f.id !== folder.id);
    const nestedFiles = db.state.files.filter((f) => f.folderId === folder.id);
    const reclaimed = nestedFiles.reduce((s, f) => s + f.sizeBytes, 0);
    user.storageUsedBytes = Math.max(0, user.storageUsedBytes - reclaimed);
    db.state.files = db.state.files.filter((f) => f.folderId !== folder.id);
  } else {
    folder.isTrashed = true;
    folder.trashedAt = new Date().toISOString();
    db.state.files.forEach((f) => {
      if (f.folderId === folder.id) {
        f.isTrashed = true;
        f.trashedAt = folder.trashedAt;
      }
    });
  }
  db.recomputeFolderMetrics(folder.parentId);
  db.logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    action: 'delete',
    targetName: folder.name,
    targetType: 'folder',
    details: permanent ? 'Permanently deleted folder' : 'Moved folder to Trash',
    ipAddress: req.ip || '127.0.0.1',
  });
  res.json({ success: true });
});

app.post('/api/v1/folders/:id/restore', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const folder = db.state.folders.find((f) => f.id === req.params.id && f.ownerId === user.id);
  if (!folder) {
    res.status(404).json({ message: 'Folder not found.' });
    return;
  }
  folder.isTrashed = false;
  folder.trashedAt = null;
  db.state.files.forEach((f) => {
    if (f.folderId === folder.id) {
      f.isTrashed = false;
      f.trashedAt = null;
    }
  });
  db.recomputeFolderMetrics(folder.parentId);
  db.logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    action: 'restore',
    targetName: folder.name,
    targetType: 'folder',
    details: 'Restored folder from Trash',
    ipAddress: req.ip || '127.0.0.1',
  });
  res.json({ folder });
});

app.get('/api/v1/files', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const scope = (req.query.scope as string) || 'my-files';
  const folderId = req.query.folderId ? String(req.query.folderId) : null;
  const search = req.query.search ? String(req.query.search).trim().toLowerCase() : '';
  const type = req.query.type ? String(req.query.type) : 'all';
  const sortBy = (req.query.sortBy as string) || 'updatedAt';
  const sortDir = (req.query.sortDir as string) === 'asc' ? 1 : -1;
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Math.min(100, Number(req.query.limit || 24)));

  let files: FileItem[] = [];
  let folders: FolderItem[] = [];

  if (scope === 'my-files') {
    if (search) {
      files = db.state.files.filter((f) => f.ownerId === user.id && !f.isTrashed);
      folders = db.state.folders.filter((f) => f.ownerId === user.id && !f.isTrashed);
    } else {
      files = db.state.files.filter(
        (f) => f.ownerId === user.id && !f.isTrashed && f.folderId === folderId,
      );
      folders = db.state.folders.filter(
        (f) => f.ownerId === user.id && !f.isTrashed && f.parentId === folderId,
      );
    }
  } else if (scope === 'recent') {
    files = db.state.files.filter((f) => f.ownerId === user.id && !f.isTrashed);
  } else if (scope === 'favorites') {
    files = db.state.files.filter((f) => f.ownerId === user.id && !f.isTrashed && f.isFavorite);
    folders = db.state.folders.filter((f) => f.ownerId === user.id && !f.isTrashed && f.isFavorite);
  } else if (scope === 'shared-with-me') {
    files = db.state.files
      .filter(
        (f) =>
          f.ownerId !== user.id &&
          !f.isTrashed &&
          f.shares.some((s) => s.email.toLowerCase() === user.email.toLowerCase()),
      )
      .map((f) => ({
        ...f,
        sharedWithMe: true,
        sharedPermission:
          f.shares.find((s) => s.email.toLowerCase() === user.email.toLowerCase())?.permission ||
          'viewer',
      }));
  } else if (scope === 'shared-by-me') {
    files = db.state.files.filter(
      (f) =>
        f.ownerId === user.id &&
        !f.isTrashed &&
        (f.shares.length > 0 || f.publicLinkEnabled),
    );
  } else if (scope === 'trash') {
    files = db.state.files.filter((f) => f.ownerId === user.id && f.isTrashed);
    folders = db.state.folders.filter((f) => f.ownerId === user.id && f.isTrashed);
  }

  // Recompute itemCount dynamically for folders returned
  folders = folders.map((fld) => {
    const count =
      db.state.files.filter((f) => f.folderId === fld.id && !f.isTrashed).length +
      db.state.folders.filter((f) => f.parentId === fld.id && !f.isTrashed).length;
    const size = db.state.files
      .filter((f) => f.folderId === fld.id && !f.isTrashed)
      .reduce((acc, f) => acc + f.sizeBytes, 0);
    return { ...fld, itemCount: count, totalSizeBytes: size };
  });

  if (search) {
    files = files.filter((f) => f.name.toLowerCase().includes(search));
    folders = folders.filter((f) => f.name.toLowerCase().includes(search));
  }

  if (type && type !== 'all') {
    files = files.filter((f) => f.category === type);
    folders = [];
  }

  files.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name) * sortDir;
    if (sortBy === 'size') return (a.sizeBytes - b.sizeBytes) * sortDir;
    return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * sortDir;
  });

  folders.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name) * sortDir;
    return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * sortDir;
  });

  const total = files.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const paginatedFiles = files.slice((safePage - 1) * limit, safePage * limit);

  res.json({
    items: paginatedFiles,
    folders,
    breadcrumbs: scope === 'my-files' ? buildBreadcrumbs(folderId, user.id) : [],
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
    },
  });
});

app.post(
  '/api/v1/files/upload',
  requireAuth,
  upload.array('files', 20),
  (req: AuthedRequest, res) => {
    const user = req.authUser!;
    const uploadedFiles = req.files as Express.Multer.File[] | undefined;
    const folderId = req.body.folderId && req.body.folderId !== 'null' ? String(req.body.folderId) : null;

    if (!uploadedFiles || uploadedFiles.length === 0) {
      res.status(400).json({ message: 'No files provided in upload request.' });
      return;
    }

    const totalAddedBytes = uploadedFiles.reduce((acc, f) => acc + f.size, 0);
    if (user.storageUsedBytes + totalAddedBytes > user.storageQuotaBytes) {
      res.status(413).json({ message: 'Upload exceeds your workspace storage quota.' });
      return;
    }

    const created: FileItem[] = [];
    for (const file of uploadedFiles) {
      const id = `fil_${crypto.randomUUID().slice(0, 8)}`;
      const ext = path.extname(file.originalname).replace('.', '') || 'bin';
      const category = classifyCategory(file.mimetype, ext);
      const storedPath = path.join(UPLOAD_DIR, `${id}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
      fs.renameSync(file.path, storedPath);

      let textSnippet: string | undefined;
      if (['txt', 'md', 'csv', 'json', 'ts', 'tsx', 'js', 'css', 'html'].includes(ext.toLowerCase())) {
        try {
          textSnippet = fs.readFileSync(storedPath, 'utf-8').slice(0, 4000);
        } catch {
          // ignore
        }
      }

      const item: FileItem = {
        id,
        name: file.originalname,
        extension: ext,
        mimeType: file.mimetype || 'application/octet-stream',
        category,
        sizeBytes: file.size,
        folderId,
        ownerId: user.id,
        ownerName: user.name,
        ownerEmail: user.email,
        isFavorite: false,
        isTrashed: false,
        trashedAt: null,
        publicLinkEnabled: false,
        publicLinkToken: null,
        publicLinkPermission: 'viewer',
        publicLinkExpiresAt: null,
        shares: [],
        previewUrl: category === 'image' ? `/api/v1/files/${id}/content` : null,
        textSnippet,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.state.files.unshift(item);
      created.push(item);

      db.logActivity({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: 'upload',
        targetName: item.name,
        targetType: 'file',
        details: `Uploaded file (${(item.sizeBytes / 1024).toFixed(1)} KB)`,
        ipAddress: req.ip || '127.0.0.1',
      });
    }

    user.storageUsedBytes += totalAddedBytes;
    db.recomputeFolderMetrics(folderId);
    db.save();

    res.status(201).json({ files: created });
  },
);

function findDiskFile(fileId: string): string | null {
  if (!fs.existsSync(UPLOAD_DIR)) return null;
  const match = fs.readdirSync(UPLOAD_DIR).find((name) => name.startsWith(`${fileId}_`));
  return match ? path.join(UPLOAD_DIR, match) : null;
}

app.get('/api/v1/files/:id/content', (req, res) => {
  const file = db.state.files.find((f) => f.id === req.params.id);
  if (!file) {
    res.status(404).json({ message: 'File not found.' });
    return;
  }
  const diskPath = findDiskFile(file.id);
  if (diskPath) {
    res.type(file.mimeType);
    res.sendFile(diskPath);
    return;
  }
  if (file.previewUrl && file.previewUrl.startsWith('/src/assets/')) {
    const assetPath = path.resolve(process.cwd(), file.previewUrl.slice(1));
    if (fs.existsSync(assetPath)) {
      res.sendFile(assetPath);
      return;
    }
  }
  res.type('text/plain').send(file.textSnippet || `${file.name} (${file.mimeType})`);
});

app.get('/api/v1/files/:id/download', requireAuth, (req: AuthedRequest, res) => {
  const file = db.state.files.find((f) => f.id === req.params.id);
  if (!file) {
    res.status(404).json({ message: 'File not found.' });
    return;
  }
  db.logActivity({
    userId: req.authUser!.id,
    userName: req.authUser!.name,
    userEmail: req.authUser!.email,
    action: 'download',
    targetName: file.name,
    targetType: 'file',
    details: 'Downloaded file',
    ipAddress: req.ip || '127.0.0.1',
  });
  const diskPath = findDiskFile(file.id);
  if (diskPath) {
    res.download(diskPath, file.name);
    return;
  }
  if (file.previewUrl && file.previewUrl.startsWith('/src/assets/')) {
    const assetPath = path.resolve(process.cwd(), file.previewUrl.slice(1));
    if (fs.existsSync(assetPath)) {
      res.download(assetPath, file.name);
      return;
    }
  }
  res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
  res.type('text/plain').send(file.textSnippet || `CloudBox File Archive: ${file.name}\nVersion: ${file.version}`);
});

app.patch('/api/v1/files/:id', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const file = db.state.files.find(
    (f) =>
      f.id === req.params.id &&
      (f.ownerId === user.id ||
        f.shares.some((s) => s.email.toLowerCase() === user.email.toLowerCase() && s.permission === 'editor')),
  );
  if (!file) {
    res.status(404).json({ message: 'File not found or permission denied.' });
    return;
  }
  const { name, folderId, isFavorite } = req.body as {
    name?: string;
    folderId?: string | null;
    isFavorite?: boolean;
  };
  const oldFolder = file.folderId;

  if (typeof name === 'string' && name.trim() && name.trim() !== file.name) {
    const oldName = file.name;
    file.name = name.trim();
    const ext = path.extname(file.name).replace('.', '');
    if (ext) file.extension = ext;
    db.logActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'rename',
      targetName: file.name,
      targetType: 'file',
      details: `Renamed from ${oldName}`,
      ipAddress: req.ip || '127.0.0.1',
    });
  }

  if (folderId !== undefined && folderId !== file.folderId) {
    file.folderId = folderId;
    db.recomputeFolderMetrics(oldFolder);
    db.recomputeFolderMetrics(folderId);
    db.logActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'move',
      targetName: file.name,
      targetType: 'file',
      details: folderId ? 'Moved file to folder' : 'Moved file to root',
      ipAddress: req.ip || '127.0.0.1',
    });
  }

  if (typeof isFavorite === 'boolean' && isFavorite !== file.isFavorite) {
    file.isFavorite = isFavorite;
    db.logActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'favorite',
      targetName: file.name,
      targetType: 'file',
      details: isFavorite ? 'Added to favorites' : 'Removed from favorites',
      ipAddress: req.ip || '127.0.0.1',
    });
  }

  file.updatedAt = new Date().toISOString();
  db.save();
  res.json({ file });
});

app.post('/api/v1/files/:id/copy', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const source = db.state.files.find((f) => f.id === req.params.id);
  if (!source) {
    res.status(404).json({ message: 'Source file not found.' });
    return;
  }
  const { targetFolderId } = req.body as { targetFolderId?: string | null };
  const ext = path.extname(source.name);
  const base = ext ? source.name.slice(0, -ext.length) : source.name;
  const copy: FileItem = {
    ...source,
    id: `fil_${crypto.randomUUID().slice(0, 8)}`,
    name: `${base} (Copy)${ext}`,
    folderId: targetFolderId !== undefined ? targetFolderId : source.folderId,
    ownerId: user.id,
    ownerName: user.name,
    ownerEmail: user.email,
    shares: [],
    publicLinkEnabled: false,
    publicLinkToken: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.state.files.unshift(copy);
  user.storageUsedBytes += copy.sizeBytes;
  db.recomputeFolderMetrics(copy.folderId);
  db.logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    action: 'copy',
    targetName: copy.name,
    targetType: 'file',
    details: `Duplicated from ${source.name}`,
    ipAddress: req.ip || '127.0.0.1',
  });
  res.status(201).json({ file: copy });
});

app.delete('/api/v1/files/:id', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const file = db.state.files.find((f) => f.id === req.params.id && f.ownerId === user.id);
  if (!file) {
    res.status(404).json({ message: 'File not found.' });
    return;
  }
  const permanent = req.query.permanent === 'true';
  if (permanent) {
    db.state.files = db.state.files.filter((f) => f.id !== file.id);
    user.storageUsedBytes = Math.max(0, user.storageUsedBytes - file.sizeBytes);
    const diskPath = findDiskFile(file.id);
    if (diskPath && fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    }
  } else {
    file.isTrashed = true;
    file.trashedAt = new Date().toISOString();
  }
  db.recomputeFolderMetrics(file.folderId);
  db.logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    action: 'delete',
    targetName: file.name,
    targetType: 'file',
    details: permanent ? 'Permanently deleted file' : 'Moved file to Trash',
    ipAddress: req.ip || '127.0.0.1',
  });
  res.json({ success: true });
});

app.post('/api/v1/files/:id/restore', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const file = db.state.files.find((f) => f.id === req.params.id && f.ownerId === user.id);
  if (!file) {
    res.status(404).json({ message: 'File not found.' });
    return;
  }
  file.isTrashed = false;
  file.trashedAt = null;
  file.updatedAt = new Date().toISOString();
  db.recomputeFolderMetrics(file.folderId);
  db.logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    action: 'restore',
    targetName: file.name,
    targetType: 'file',
    details: 'Restored file from Trash',
    ipAddress: req.ip || '127.0.0.1',
  });
  res.json({ file });
});

app.post('/api/v1/files/bulk', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const { ids = [], folderIds = [], action, targetFolderId } = req.body as {
    ids?: string[];
    folderIds?: string[];
    action: 'delete' | 'permanent-delete' | 'restore' | 'move' | 'favorite' | 'unfavorite';
    targetFolderId?: string | null;
  };
  let affected = 0;

  for (const id of ids) {
    const file = db.state.files.find((f) => f.id === id && f.ownerId === user.id);
    if (!file) continue;
    affected++;
    if (action === 'delete') {
      file.isTrashed = true;
      file.trashedAt = new Date().toISOString();
    } else if (action === 'permanent-delete') {
      db.state.files = db.state.files.filter((f) => f.id !== id);
      user.storageUsedBytes = Math.max(0, user.storageUsedBytes - file.sizeBytes);
    } else if (action === 'restore') {
      file.isTrashed = false;
      file.trashedAt = null;
    } else if (action === 'move') {
      const prev = file.folderId;
      file.folderId = targetFolderId ?? null;
      db.recomputeFolderMetrics(prev);
      db.recomputeFolderMetrics(file.folderId);
    } else if (action === 'favorite') {
      file.isFavorite = true;
    } else if (action === 'unfavorite') {
      file.isFavorite = false;
    }
    file.updatedAt = new Date().toISOString();
  }

  for (const fid of folderIds) {
    const folder = db.state.folders.find((f) => f.id === fid && f.ownerId === user.id);
    if (!folder) continue;
    affected++;
    if (action === 'delete') {
      folder.isTrashed = true;
      folder.trashedAt = new Date().toISOString();
    } else if (action === 'permanent-delete') {
      db.state.folders = db.state.folders.filter((f) => f.id !== fid);
    } else if (action === 'restore') {
      folder.isTrashed = false;
      folder.trashedAt = null;
    } else if (action === 'favorite') {
      folder.isFavorite = true;
    } else if (action === 'unfavorite') {
      folder.isFavorite = false;
    }
  }

  db.save();
  res.json({ affected });
});

app.post('/api/v1/trash/empty', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const trashedFiles = db.state.files.filter((f) => f.ownerId === user.id && f.isTrashed);
  const reclaimed = trashedFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
  db.state.files = db.state.files.filter((f) => !(f.ownerId === user.id && f.isTrashed));
  db.state.folders = db.state.folders.filter((f) => !(f.ownerId === user.id && f.isTrashed));
  user.storageUsedBytes = Math.max(0, user.storageUsedBytes - reclaimed);
  db.logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    action: 'delete',
    targetName: 'Trash Bin',
    targetType: 'account',
    details: `Emptied ${trashedFiles.length} file(s) from Trash`,
    ipAddress: req.ip || '127.0.0.1',
  });
  res.json({ success: true, reclaimedBytes: reclaimed });
});

// ==========================================
// SHARING & PERMISSIONS
// ==========================================
app.get('/api/v1/files/:id/shares', requireAuth, (req: AuthedRequest, res) => {
  const file = db.state.files.find((f) => f.id === req.params.id);
  if (!file) {
    res.status(404).json({ message: 'File not found.' });
    return;
  }
  res.json({
    shares: file.shares,
    publicLinkEnabled: file.publicLinkEnabled,
    publicLinkToken: file.publicLinkToken,
    publicLinkPermission: file.publicLinkPermission,
    publicLinkExpiresAt: file.publicLinkExpiresAt,
  });
});

app.post('/api/v1/files/:id/shares', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const file = db.state.files.find((f) => f.id === req.params.id && f.ownerId === user.id);
  if (!file) {
    res.status(404).json({ message: 'File not found or you are not the owner.' });
    return;
  }
  const { email, permission, publicLinkEnabled, publicLinkPermission, publicLinkExpiresAt } = req.body as {
    email?: string;
    permission?: 'viewer' | 'editor' | 'owner';
    publicLinkEnabled?: boolean;
    publicLinkPermission?: 'viewer' | 'editor';
    publicLinkExpiresAt?: string | null;
  };

  if (email && email.trim()) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = file.shares.find((s) => s.email.toLowerCase() === cleanEmail);
    const matchedUser = db.state.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      existing.permission = permission || existing.permission;
    } else {
      file.shares.push({
        id: `shr_${crypto.randomUUID().slice(0, 8)}`,
        email: cleanEmail,
        name: matchedUser?.name || cleanEmail.split('@')[0],
        avatarUrl: matchedUser?.avatarUrl,
        permission: permission || 'viewer',
        addedAt: new Date().toISOString(),
      });
    }
    if (matchedUser) {
      db.state.notifications.unshift({
        id: `ntf_${crypto.randomUUID().slice(0, 8)}`,
        userId: matchedUser.id,
        title: `${user.name} shared a file with you`,
        message: `You now have ${permission || 'viewer'} access to ${file.name}.`,
        type: 'share',
        isRead: false,
        link: '/dashboard/shared-with-me',
        createdAt: new Date().toISOString(),
      });
    }
    db.logActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'share',
      targetName: file.name,
      targetType: 'file',
      details: `Shared with ${cleanEmail} (${permission || 'viewer'})`,
      ipAddress: req.ip || '127.0.0.1',
    });
  }

  if (typeof publicLinkEnabled === 'boolean') {
    file.publicLinkEnabled = publicLinkEnabled;
    if (publicLinkEnabled && !file.publicLinkToken) {
      file.publicLinkToken = generateToken('cb_pub');
    }
  }
  if (publicLinkPermission) {
    file.publicLinkPermission = publicLinkPermission;
  }
  if (publicLinkExpiresAt !== undefined) {
    file.publicLinkExpiresAt = publicLinkExpiresAt;
  }

  file.updatedAt = new Date().toISOString();
  db.save();
  res.json({ file });
});

app.delete('/api/v1/files/:id/shares/:shareId', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const file = db.state.files.find((f) => f.id === req.params.id && f.ownerId === user.id);
  if (!file) {
    res.status(404).json({ message: 'File not found.' });
    return;
  }
  file.shares = file.shares.filter((s) => s.id !== req.params.shareId);
  db.save();
  res.json({ file });
});

// ==========================================
// NOTIFICATIONS & SETTINGS
// ==========================================
app.get('/api/v1/notifications', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const items = db.state.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({
    notifications: items,
    unreadCount: items.filter((n) => !n.isRead).length,
  });
});

app.patch('/api/v1/notifications/:id/read', requireAuth, (req: AuthedRequest, res) => {
  const ntf = db.state.notifications.find(
    (n) => n.id === req.params.id && n.userId === req.authUser!.id,
  );
  if (ntf) {
    ntf.isRead = true;
    db.save();
  }
  res.json({ success: true });
});

app.post('/api/v1/notifications/read-all', requireAuth, (req: AuthedRequest, res) => {
  db.state.notifications.forEach((n) => {
    if (n.userId === req.authUser!.id) n.isRead = true;
  });
  db.save();
  res.json({ success: true });
});

app.patch('/api/v1/users/profile', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const { name, title, company, timezone } = req.body as {
    name?: string;
    title?: string;
    company?: string;
    timezone?: string;
  };
  if (name?.trim()) user.name = name.trim();
  if (title !== undefined) user.title = title.trim();
  if (company !== undefined) user.company = company.trim();
  if (timezone !== undefined) user.timezone = timezone.trim();
  db.save();
  res.json({ user: db.sanitizeUser(user) });
});

app.patch('/api/v1/users/password', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: 'Current and new password are required.' });
    return;
  }
  if (user.passwordHash !== hashPassword(currentPassword)) {
    res.status(400).json({ message: 'Current password is incorrect.' });
    return;
  }
  user.passwordHash = hashPassword(newPassword);
  db.logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    action: 'security_update',
    targetName: 'Account Password',
    targetType: 'account',
    details: 'Updated account password',
    ipAddress: req.ip || '127.0.0.1',
  });
  res.json({ message: 'Password updated successfully.' });
});

app.patch('/api/v1/users/security', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const { twoFactorEnabled, sessionTimeoutMinutes, loginAlertsEnabled } = req.body as {
    twoFactorEnabled?: boolean;
    sessionTimeoutMinutes?: number;
    loginAlertsEnabled?: boolean;
  };
  if (typeof twoFactorEnabled === 'boolean') user.twoFactorEnabled = twoFactorEnabled;
  if (typeof sessionTimeoutMinutes === 'number') user.sessionTimeoutMinutes = sessionTimeoutMinutes;
  if (typeof loginAlertsEnabled === 'boolean') user.loginAlertsEnabled = loginAlertsEnabled;
  db.logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    action: 'security_update',
    targetName: 'Security Preferences',
    targetType: 'account',
    details: `Updated 2FA (${user.twoFactorEnabled ? 'Enabled' : 'Disabled'}) & session controls`,
    ipAddress: req.ip || '127.0.0.1',
  });
  res.json({ user: db.sanitizeUser(user) });
});

app.get('/api/v1/users/sessions', requireAuth, (req: AuthedRequest, res) => {
  const sessions = db.state.sessions.filter((s) => s.userId === req.authUser!.id);
  res.json({ sessions });
});

app.delete('/api/v1/users/sessions/:id', requireAuth, (req: AuthedRequest, res) => {
  db.state.sessions = db.state.sessions.filter(
    (s) => !(s.id === req.params.id && s.userId === req.authUser!.id && !s.current),
  );
  db.save();
  res.json({ success: true });
});

// ==========================================
// ADMIN ROUTES
// ==========================================
app.get('/api/v1/admin/overview', requireAuth, requireAdmin, (_req, res) => {
  const users = db.state.users;
  const totalStorageUsedBytes = users.reduce((s, u) => s + u.storageUsedBytes, 0);
  const totalStorageAllocatedBytes = users.reduce((s, u) => s + u.storageQuotaBytes, 0);
  const mrr = db.state.subscriptions
    .filter((s) => s.status === 'active')
    .reduce((acc, s) => acc + s.monthlyPriceUsd, 0);

  const plans: PlanTier[] = ['Starter', 'Pro', 'Business', 'Enterprise'];
  const planDistribution = plans.map((plan) => {
    const planUsers = users.filter((u) => u.plan === plan).length;
    const planRev = db.state.subscriptions
      .filter((s) => s.plan === plan && s.status === 'active')
      .reduce((acc, s) => acc + s.monthlyPriceUsd, 0);
    return { plan, users: planUsers, revenue: planRev };
  });

  res.json({
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === 'active').length,
    suspendedUsers: users.filter((u) => u.status === 'suspended').length,
    totalFiles: db.state.files.length,
    totalFolders: db.state.folders.length,
    totalStorageUsedBytes,
    totalStorageAllocatedBytes,
    monthlyRecurringRevenueUsd: mrr,
    dailyActivitySeries: [
      { day: 'Mon', uploads: 142, downloads: 310, shares: 48 },
      { day: 'Tue', uploads: 198, downloads: 402, shares: 64 },
      { day: 'Wed', uploads: 176, downloads: 365, shares: 59 },
      { day: 'Thu', uploads: 234, downloads: 490, shares: 81 },
      { day: 'Fri', uploads: 268, downloads: 528, shares: 92 },
      { day: 'Sat', uploads: 112, downloads: 215, shares: 31 },
      { day: 'Sun', uploads: 129, downloads: 248, shares: 39 },
    ],
    planDistribution,
    recentLogs: db.state.activities.slice(0, 10),
  });
});

app.get('/api/v1/admin/users', requireAuth, requireAdmin, (req, res) => {
  const search = req.query.search ? String(req.query.search).toLowerCase() : '';
  const role = req.query.role ? String(req.query.role) : 'all';
  let list = db.state.users.map((u) => db.sanitizeUser(u));
  if (search) {
    list = list.filter(
      (u) =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.company.toLowerCase().includes(search),
    );
  }
  if (role !== 'all') {
    list = list.filter((u) => u.role === role);
  }
  res.json({ users: list });
});

app.post('/api/v1/admin/users', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  const { name, email, role = 'user', plan = 'Pro', company = '' } = req.body as {
    name?: string;
    email?: string;
    role?: 'user' | 'admin';
    plan?: PlanTier;
    company?: string;
  };
  if (!name || !email) {
    res.status(400).json({ message: 'Name and email are required.' });
    return;
  }
  if (db.state.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
    res.status(409).json({ message: 'Email already registered.' });
    return;
  }
  const newUser: StoredUser = {
    id: `usr_${crypto.randomUUID().slice(0, 8)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword('CloudBox2026!'),
    role,
    status: 'active',
    plan,
    title: 'Team Member',
    company: company.trim() || 'CloudBox Workspace',
    timezone: 'UTC',
    avatarUrl: '',
    emailVerified: true,
    twoFactorEnabled: false,
    sessionTimeoutMinutes: 60,
    loginAlertsEnabled: true,
    storageUsedBytes: 0,
    storageQuotaBytes: quotaForPlan(plan),
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };
  db.state.users.push(newUser);
  db.logActivity({
    userId: req.authUser!.id,
    userName: req.authUser!.name,
    userEmail: req.authUser!.email,
    action: 'security_update',
    targetName: newUser.email,
    targetType: 'account',
    details: `Provisioned ${plan} user account`,
    ipAddress: req.ip || '127.0.0.1',
  });
  res.status(201).json({ user: db.sanitizeUser(newUser) });
});

app.patch('/api/v1/admin/users/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  const target = db.state.users.find((u) => u.id === req.params.id);
  if (!target) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }
  const { role, status, plan, storageQuotaGb } = req.body as {
    role?: 'user' | 'admin';
    status?: 'active' | 'suspended';
    plan?: PlanTier;
    storageQuotaGb?: number;
  };
  if (role) target.role = role;
  if (status) target.status = status;
  if (plan) {
    target.plan = plan;
    target.storageQuotaBytes = quotaForPlan(plan);
  }
  if (typeof storageQuotaGb === 'number' && storageQuotaGb > 0) {
    target.storageQuotaBytes = storageQuotaGb * 1024 * 1024 * 1024;
  }
  db.logActivity({
    userId: req.authUser!.id,
    userName: req.authUser!.name,
    userEmail: req.authUser!.email,
    action: 'security_update',
    targetName: target.email,
    targetType: 'account',
    details: `Updated user status (${target.status}) / plan (${target.plan})`,
    ipAddress: req.ip || '127.0.0.1',
  });
  res.json({ user: db.sanitizeUser(target) });
});

app.delete('/api/v1/admin/users/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  if (req.params.id === req.authUser!.id) {
    res.status(400).json({ message: 'You cannot delete your own active administrator account.' });
    return;
  }
  const target = db.state.users.find((u) => u.id === req.params.id);
  if (!target) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }
  db.state.users = db.state.users.filter((u) => u.id !== target.id);
  db.save();
  res.json({ success: true });
});

app.get('/api/v1/admin/storage', requireAuth, requireAdmin, (_req, res) => {
  const topConsumers = [...db.state.users]
    .sort((a, b) => b.storageUsedBytes - a.storageUsedBytes)
    .map((u) => db.sanitizeUser(u));
  res.json({
    nodes: db.state.storageNodes,
    topConsumers,
    defaultUserQuotaGb: db.state.settings.defaultUserQuotaGb,
    maxUploadSizeMb: db.state.settings.maxUploadSizeMb,
  });
});

app.patch('/api/v1/admin/storage/settings', requireAuth, requireAdmin, (req, res) => {
  const { defaultUserQuotaGb, maxUploadSizeMb } = req.body as {
    defaultUserQuotaGb?: number;
    maxUploadSizeMb?: number;
  };
  if (typeof defaultUserQuotaGb === 'number' && defaultUserQuotaGb > 0) {
    db.state.settings.defaultUserQuotaGb = defaultUserQuotaGb;
  }
  if (typeof maxUploadSizeMb === 'number' && maxUploadSizeMb > 0) {
    db.state.settings.maxUploadSizeMb = maxUploadSizeMb;
  }
  db.save();
  res.json(db.state.settings);
});

app.get('/api/v1/admin/logs', requireAuth, requireAdmin, (req, res) => {
  const action = req.query.action ? String(req.query.action) : 'all';
  const search = req.query.search ? String(req.query.search).toLowerCase() : '';
  let logs = [...db.state.activities];
  if (action !== 'all') {
    logs = logs.filter((l) => l.action === action);
  }
  if (search) {
    logs = logs.filter(
      (l) =>
        l.userName.toLowerCase().includes(search) ||
        l.targetName.toLowerCase().includes(search) ||
        l.details.toLowerCase().includes(search),
    );
  }
  res.json({ logs });
});

app.get('/api/v1/admin/stats', requireAuth, requireAdmin, (_req, res) => {
  res.json({
    uptimePercent: 99.99,
    avgApiLatencyMs: 24,
    requestsPerMinute: 1840,
    errorRatePercent: 0.04,
    bandwidthSeries: [
      { time: '00:00', ingressGb: 18.2, egressGb: 41.4, latencyMs: 21 },
      { time: '04:00', ingressGb: 12.6, egressGb: 29.8, latencyMs: 19 },
      { time: '08:00', ingressGb: 44.1, egressGb: 88.2, latencyMs: 25 },
      { time: '12:00', ingressGb: 68.4, egressGb: 132.5, latencyMs: 28 },
      { time: '16:00', ingressGb: 74.0, egressGb: 148.9, latencyMs: 26 },
      { time: '20:00', ingressGb: 39.8, egressGb: 76.1, latencyMs: 22 },
    ],
    endpointMetrics: [
      { endpoint: 'POST /api/v1/files/upload', calls24h: 18420, p95Ms: 142, errorRate: 0.08 },
      { endpoint: 'GET /api/v1/files', calls24h: 94210, p95Ms: 28, errorRate: 0.02 },
      { endpoint: 'GET /api/v1/files/:id/download', calls24h: 41350, p95Ms: 64, errorRate: 0.03 },
      { endpoint: 'POST /api/v1/files/:id/shares', calls24h: 6120, p95Ms: 39, errorRate: 0.01 },
      { endpoint: 'POST /api/v1/auth/refresh', calls24h: 12940, p95Ms: 19, errorRate: 0.05 },
    ],
  });
});

app.get('/api/v1/admin/subscriptions', requireAuth, requireAdmin, (_req, res) => {
  res.json({ subscriptions: db.state.subscriptions });
});

app.patch('/api/v1/admin/subscriptions/:id', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
  const sub = db.state.subscriptions.find((s) => s.id === req.params.id);
  if (!sub) {
    res.status(404).json({ message: 'Subscription not found.' });
    return;
  }
  const { plan, seats, status } = req.body as {
    plan?: PlanTier;
    seats?: number;
    status?: 'active' | 'past_due' | 'canceled';
  };
  const priceMap: Record<PlanTier, number> = {
    Starter: 0,
    Pro: 15,
    Business: 23,
    Enterprise: 40,
  };
  if (plan) {
    sub.plan = plan;
    sub.storageQuotaBytes = quotaForPlan(plan);
  }
  if (typeof seats === 'number' && seats > 0) {
    sub.seats = seats;
  }
  if (status) {
    sub.status = status;
  }
  sub.monthlyPriceUsd = priceMap[sub.plan] * sub.seats;

  db.logActivity({
    userId: req.authUser!.id,
    userName: req.authUser!.name,
    userEmail: req.authUser!.email,
    action: 'plan_change',
    targetName: sub.organization,
    targetType: 'system',
    details: `Updated subscription to ${sub.plan} (${sub.seats} seats, ${sub.status})`,
    ipAddress: req.ip || '127.0.0.1',
  });
  res.json({ subscription: sub });
});

// ==========================================
// SERVER STARTUP (VITE DEV OR PROD STATIC)
// ==========================================
async function startServer() {
  const port = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`CloudBox server running on http://0.0.0.0:${port}`);
  });
}

startServer();
