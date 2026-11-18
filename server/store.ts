import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  ActivityEvent,
  AdminStorageNode,
  FileCategory,
  FileItem,
  FolderItem,
  NotificationItem,
  PlanTier,
  SubscriptionRecord,
  User,
  UserSession,
} from '../src/types/index.ts';

export interface StoredUser extends User {
  passwordHash: string;
  verificationCode?: string;
  resetToken?: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface DatabaseState {
  users: StoredUser[];
  folders: FolderItem[];
  files: FileItem[];
  activities: ActivityEvent[];
  notifications: NotificationItem[];
  sessions: UserSession[];
  subscriptions: SubscriptionRecord[];
  storageNodes: AdminStorageNode[];
  contacts: ContactSubmission[];
  refreshTokens: Record<string, { userId: string; expiresAt: number }>;
  accessTokens: Record<string, { userId: string; expiresAt: number }>;
  settings: {
    defaultUserQuotaGb: number;
    maxUploadSizeMb: number;
  };
}

const DATA_FILE = path.resolve(process.cwd(), '.cloudbox-data.json');
export const UPLOAD_DIR = path.resolve(process.cwd(), '.cloudbox-uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`cloudbox:${password}`).digest('hex');
}

export function generateToken(prefix = 'cb'): string {
  return `${prefix}_${crypto.randomBytes(24).toString('hex')}`;
}

export function classifyCategory(mimeType: string, ext: string): FileCategory {
  const e = ext.toLowerCase();
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(e)) {
    return 'image';
  }
  if (mimeType.startsWith('video/') || ['mp4', 'mov', 'webm', 'mkv'].includes(e)) {
    return 'video';
  }
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'aac', 'flac', 'ogg'].includes(e)) {
    return 'audio';
  }
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(e)) {
    return 'archive';
  }
  if (['ts', 'tsx', 'js', 'jsx', 'json', 'css', 'html', 'py', 'sql', 'yml', 'yaml'].includes(e)) {
    return 'code';
  }
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'csv'].includes(e)) {
    return 'document';
  }
  return 'other';
}

const GB = 1024 * 1024 * 1024;
const MB = 1024 * 1024;

function createSeedState(): DatabaseState {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(now - d * 86400 * 1000).toISOString();

  const elena: StoredUser = {
    id: 'usr_elena',
    name: 'Elena Vance',
    email: 'elena@cloudbox.io',
    passwordHash: hashPassword('CloudBox2026!'),
    role: 'user',
    status: 'active',
    plan: 'Pro',
    title: 'Principal Product Architect',
    company: 'Northwind Studio',
    timezone: 'America/Los_Angeles',
    avatarUrl: '/src/assets/images/avatar_user_elena_1795034770141.jpg',
    emailVerified: true,
    twoFactorEnabled: true,
    sessionTimeoutMinutes: 60,
    loginAlertsEnabled: true,
    storageUsedBytes: 0,
    storageQuotaBytes: 100 * GB,
    createdAt: daysAgo(140),
    lastActiveAt: hoursAgo(1),
  };

  const admin: StoredUser = {
    id: 'usr_admin',
    name: 'Marcus Chen',
    email: 'admin@cloudbox.io',
    passwordHash: hashPassword('AdminBox2026!'),
    role: 'admin',
    status: 'active',
    plan: 'Enterprise',
    title: 'VP of Infrastructure',
    company: 'CloudBox Inc.',
    timezone: 'America/New_York',
    avatarUrl: '',
    emailVerified: true,
    twoFactorEnabled: true,
    sessionTimeoutMinutes: 30,
    loginAlertsEnabled: true,
    storageUsedBytes: 12.4 * GB,
    storageQuotaBytes: 1000 * GB,
    createdAt: daysAgo(360),
    lastActiveAt: hoursAgo(0.2),
  };

  const extraUsers: StoredUser[] = [
    {
      id: 'usr_claire',
      name: 'Claire Moreau',
      email: 'claire@atelier-lyon.fr',
      passwordHash: hashPassword('Claire2026!'),
      role: 'user',
      status: 'active',
      plan: 'Business',
      title: 'Creative Director',
      company: 'Atelier Lyon',
      timezone: 'Europe/Paris',
      avatarUrl: '',
      emailVerified: true,
      twoFactorEnabled: false,
      sessionTimeoutMinutes: 120,
      loginAlertsEnabled: true,
      storageUsedBytes: 42.8 * GB,
      storageQuotaBytes: 500 * GB,
      createdAt: daysAgo(95),
      lastActiveAt: hoursAgo(5),
    },
    {
      id: 'usr_devon',
      name: 'Devon Brooks',
      email: 'devon@metriclabs.io',
      passwordHash: hashPassword('Devon2026!'),
      role: 'user',
      status: 'active',
      plan: 'Pro',
      title: 'Data Engineer',
      company: 'Metric Labs',
      timezone: 'America/Chicago',
      avatarUrl: '',
      emailVerified: true,
      twoFactorEnabled: true,
      sessionTimeoutMinutes: 60,
      loginAlertsEnabled: false,
      storageUsedBytes: 68.4 * GB,
      storageQuotaBytes: 100 * GB,
      createdAt: daysAgo(62),
      lastActiveAt: daysAgo(1),
    },
    {
      id: 'usr_hana',
      name: 'Hana Takahashi',
      email: 'hana@kuroda-arch.jp',
      passwordHash: hashPassword('Hana2026!'),
      role: 'user',
      status: 'suspended',
      plan: 'Starter',
      title: 'Structural Designer',
      company: 'Kuroda Architects',
      timezone: 'Asia/Tokyo',
      avatarUrl: '',
      emailVerified: true,
      twoFactorEnabled: false,
      sessionTimeoutMinutes: 60,
      loginAlertsEnabled: true,
      storageUsedBytes: 14.9 * GB,
      storageQuotaBytes: 15 * GB,
      createdAt: daysAgo(210),
      lastActiveAt: daysAgo(14),
    },
  ];

  const folders: FolderItem[] = [
    {
      id: 'fld_brand',
      name: 'Brand & Visual Systems',
      parentId: null,
      ownerId: elena.id,
      ownerName: elena.name,
      isFavorite: true,
      isTrashed: false,
      trashedAt: null,
      itemCount: 3,
      totalSizeBytes: 0,
      createdAt: daysAgo(45),
      updatedAt: hoursAgo(3),
    },
    {
      id: 'fld_product',
      name: 'Q4 Product Launches',
      parentId: null,
      ownerId: elena.id,
      ownerName: elena.name,
      isFavorite: false,
      isTrashed: false,
      trashedAt: null,
      itemCount: 2,
      totalSizeBytes: 0,
      createdAt: daysAgo(30),
      updatedAt: hoursAgo(8),
    },
    {
      id: 'fld_legal',
      name: 'Contracts & Compliance',
      parentId: null,
      ownerId: elena.id,
      ownerName: elena.name,
      isFavorite: false,
      isTrashed: false,
      trashedAt: null,
      itemCount: 2,
      totalSizeBytes: 0,
      createdAt: daysAgo(60),
      updatedAt: daysAgo(3),
    },
    {
      id: 'fld_renders',
      name: 'Studio Photography',
      parentId: 'fld_brand',
      ownerId: elena.id,
      ownerName: elena.name,
      isFavorite: true,
      isTrashed: false,
      trashedAt: null,
      itemCount: 2,
      totalSizeBytes: 0,
      createdAt: daysAgo(20),
      updatedAt: hoursAgo(4),
    },
    {
      id: 'fld_archive_old',
      name: 'Legacy Pitch Decks 2024',
      parentId: null,
      ownerId: elena.id,
      ownerName: elena.name,
      isFavorite: false,
      isTrashed: true,
      trashedAt: daysAgo(2),
      itemCount: 1,
      totalSizeBytes: 0,
      createdAt: daysAgo(120),
      updatedAt: daysAgo(2),
    },
  ];

  const files: FileItem[] = [
    {
      id: 'fil_1',
      name: 'CloudBox_Enterprise_Architecture.pdf',
      extension: 'pdf',
      mimeType: 'application/pdf',
      category: 'document',
      sizeBytes: Math.round(4.8 * MB),
      folderId: null,
      ownerId: elena.id,
      ownerName: elena.name,
      ownerEmail: elena.email,
      isFavorite: true,
      isTrashed: false,
      trashedAt: null,
      publicLinkEnabled: true,
      publicLinkToken: 'cb_share_arch_2026',
      publicLinkPermission: 'viewer',
      publicLinkExpiresAt: null,
      shares: [
        {
          id: 'shr_1',
          email: 'claire@atelier-lyon.fr',
          name: 'Claire Moreau',
          permission: 'editor',
          addedAt: daysAgo(4),
        },
        {
          id: 'shr_2',
          email: 'devon@metriclabs.io',
          name: 'Devon Brooks',
          permission: 'viewer',
          addedAt: daysAgo(2),
        },
      ],
      previewUrl: null,
      textSnippet:
        'CloudBox Enterprise Reference Architecture v3.2\n\n1. Zero-Knowledge Encryption Layer\nAll objects are chunked into 4 MB blocks, encrypted client-side with AES-256-GCM before TLS 1.3 transport.\n\n2. Multi-Region Replication\nMetadata indexes replicate across US-West, EU-Central, and AP-Northeast within 180ms p95.',
      version: 4,
      createdAt: daysAgo(12),
      updatedAt: hoursAgo(2),
    },
    {
      id: 'fil_2',
      name: 'Scandinavian_Studio_Lookbook.jpg',
      extension: 'jpg',
      mimeType: 'image/jpeg',
      category: 'image',
      sizeBytes: Math.round(6.4 * MB),
      folderId: 'fld_renders',
      ownerId: elena.id,
      ownerName: elena.name,
      ownerEmail: elena.email,
      isFavorite: true,
      isTrashed: false,
      trashedAt: null,
      publicLinkEnabled: true,
      publicLinkToken: 'cb_share_studio_look',
      publicLinkPermission: 'viewer',
      publicLinkExpiresAt: null,
      shares: [
        {
          id: 'shr_3',
          email: 'claire@atelier-lyon.fr',
          name: 'Claire Moreau',
          permission: 'viewer',
          addedAt: daysAgo(1),
        },
      ],
      previewUrl: '/src/assets/images/preview_design_deck_1795034769867.jpg',
      version: 2,
      createdAt: daysAgo(9),
      updatedAt: hoursAgo(4),
    },
    {
      id: 'fil_3',
      name: 'Portable_SSD_Product_Shot.jpg',
      extension: 'jpg',
      mimeType: 'image/jpeg',
      category: 'image',
      sizeBytes: Math.round(5.1 * MB),
      folderId: 'fld_renders',
      ownerId: elena.id,
      ownerName: elena.name,
      ownerEmail: elena.email,
      isFavorite: false,
      isTrashed: false,
      trashedAt: null,
      publicLinkEnabled: false,
      publicLinkToken: null,
      publicLinkPermission: 'viewer',
      publicLinkExpiresAt: null,
      shares: [],
      previewUrl: '/src/assets/images/preview_product_shot_1795034769554.jpg',
      version: 1,
      createdAt: daysAgo(8),
      updatedAt: daysAgo(3),
    },
    {
      id: 'fil_4',
      name: 'Q4_Revenue_Forecast_2026.csv',
      extension: 'csv',
      mimeType: 'text/csv',
      category: 'document',
      sizeBytes: Math.round(1.2 * MB),
      folderId: 'fld_product',
      ownerId: elena.id,
      ownerName: elena.name,
      ownerEmail: elena.email,
      isFavorite: false,
      isTrashed: false,
      trashedAt: null,
      publicLinkEnabled: false,
      publicLinkToken: null,
      publicLinkPermission: 'viewer',
      publicLinkExpiresAt: null,
      shares: [
        {
          id: 'shr_4',
          email: 'admin@cloudbox.io',
          name: 'Marcus Chen',
          permission: 'editor',
          addedAt: daysAgo(5),
        },
      ],
      previewUrl: null,
      textSnippet:
        'Month,Plan,Active_Seats,MRR_USD,Net_Retention\n2026-08,Pro,1420,21300,108.4%\n2026-09,Business,640,28800,114.2%\n2026-10,Enterprise,185,37000,121.0%\n2026-11,Enterprise,214,42800,123.6%',
      version: 3,
      createdAt: daysAgo(15),
      updatedAt: hoursAgo(7),
    },
    {
      id: 'fil_5',
      name: 'Workspace_Hero_Campaign.jpg',
      extension: 'jpg',
      mimeType: 'image/jpeg',
      category: 'image',
      sizeBytes: Math.round(8.2 * MB),
      folderId: 'fld_brand',
      ownerId: elena.id,
      ownerName: elena.name,
      ownerEmail: elena.email,
      isFavorite: true,
      isTrashed: false,
      trashedAt: null,
      publicLinkEnabled: true,
      publicLinkToken: 'cb_share_hero_2026',
      publicLinkPermission: 'viewer',
      publicLinkExpiresAt: null,
      shares: [],
      previewUrl: '/src/assets/images/hero_cloudbox_workspace_1795034768472.jpg',
      version: 2,
      createdAt: daysAgo(6),
      updatedAt: hoursAgo(11),
    },
    {
      id: 'fil_6',
      name: 'Release_Notes_v4_2.md',
      extension: 'md',
      mimeType: 'text/markdown',
      category: 'document',
      sizeBytes: Math.round(0.35 * MB),
      folderId: null,
      ownerId: elena.id,
      ownerName: elena.name,
      ownerEmail: elena.email,
      isFavorite: false,
      isTrashed: false,
      trashedAt: null,
      publicLinkEnabled: false,
      publicLinkToken: null,
      publicLinkPermission: 'viewer',
      publicLinkExpiresAt: null,
      shares: [],
      previewUrl: null,
      textSnippet:
        '# CloudBox v4.2 Release Notes\n\n- **Incremental Block Sync**: Up to 4.2x faster delta uploads for large CAD and RAW photography bundles.\n- **Granular Link Expiry**: Enforce automatic 7-day or 30-day expiration on external share links.\n- **SOC 2 Type II Audit Trail**: Exportable CSV & JSON telemetry for enterprise compliance teams.',
      version: 1,
      createdAt: daysAgo(4),
      updatedAt: hoursAgo(14),
    },
    {
      id: 'fil_7',
      name: 'Design_System_Tokens.json',
      extension: 'json',
      mimeType: 'application/json',
      category: 'code',
      sizeBytes: Math.round(0.45 * MB),
      folderId: 'fld_brand',
      ownerId: elena.id,
      ownerName: elena.name,
      ownerEmail: elena.email,
      isFavorite: false,
      isTrashed: false,
      trashedAt: null,
      publicLinkEnabled: false,
      publicLinkToken: null,
      publicLinkPermission: 'viewer',
      publicLinkExpiresAt: null,
      shares: [],
      previewUrl: null,
      textSnippet: JSON.stringify(
        {
          brand: 'CloudBox',
          palette: { primary: '#2563EB', surface: '#F8FAFC', ink: '#0F172A' },
          typography: { display: 'Plus Jakarta Sans', body: 'DM Sans', mono: 'JetBrains Mono' },
          radii: { card: '12px', button: '8px' },
        },
        null,
        2,
      ),
      version: 5,
      createdAt: daysAgo(18),
      updatedAt: daysAgo(1),
    },
    {
      id: 'fil_8',
      name: 'Keynote_Product_Demo_1080p.mp4',
      extension: 'mp4',
      mimeType: 'video/mp4',
      category: 'video',
      sizeBytes: Math.round(420 * MB),
      folderId: 'fld_product',
      ownerId: elena.id,
      ownerName: elena.name,
      ownerEmail: elena.email,
      isFavorite: false,
      isTrashed: false,
      trashedAt: null,
      publicLinkEnabled: false,
      publicLinkToken: null,
      publicLinkPermission: 'viewer',
      publicLinkExpiresAt: null,
      shares: [],
      previewUrl: null,
      version: 1,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(2),
    },
    {
      id: 'fil_9',
      name: 'SOC2_Security_Attestation_2026.pdf',
      extension: 'pdf',
      mimeType: 'application/pdf',
      category: 'document',
      sizeBytes: Math.round(3.1 * MB),
      folderId: 'fld_legal',
      ownerId: elena.id,
      ownerName: elena.name,
      ownerEmail: elena.email,
      isFavorite: false,
      isTrashed: false,
      trashedAt: null,
      publicLinkEnabled: false,
      publicLinkToken: null,
      publicLinkPermission: 'viewer',
      publicLinkExpiresAt: null,
      shares: [],
      previewUrl: null,
      textSnippet:
        'Independent Service Auditor Report — SOC 2 Type II\nTrust Services Criteria: Security, Availability, Confidentiality.\nObservation Period: Jan 1, 2026 – Oct 31, 2026. Zero exceptions noted.',
      version: 1,
      createdAt: daysAgo(22),
      updatedAt: daysAgo(5),
    },
    {
      id: 'fil_10',
      name: 'Vendor_DPA_Template.docx',
      extension: 'docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      category: 'document',
      sizeBytes: Math.round(1.6 * MB),
      folderId: 'fld_legal',
      ownerId: elena.id,
      ownerName: elena.name,
      ownerEmail: elena.email,
      isFavorite: false,
      isTrashed: false,
      trashedAt: null,
      publicLinkEnabled: false,
      publicLinkToken: null,
      publicLinkPermission: 'viewer',
      publicLinkExpiresAt: null,
      shares: [],
      previewUrl: null,
      textSnippet: 'Data Processing Addendum (GDPR & CCPA Standard Contractual Clauses).',
      version: 2,
      createdAt: daysAgo(25),
      updatedAt: daysAgo(7),
    },
    {
      id: 'fil_11',
      name: 'Podcast_Founder_Interview.mp3',
      extension: 'mp3',
      mimeType: 'audio/mpeg',
      category: 'audio',
      sizeBytes: Math.round(38 * MB),
      folderId: null,
      ownerId: elena.id,
      ownerName: elena.name,
      ownerEmail: elena.email,
      isFavorite: false,
      isTrashed: false,
      trashedAt: null,
      publicLinkEnabled: false,
      publicLinkToken: null,
      publicLinkPermission: 'viewer',
      publicLinkExpiresAt: null,
      shares: [],
      previewUrl: null,
      version: 1,
      createdAt: daysAgo(14),
      updatedAt: daysAgo(6),
    },
    {
      id: 'fil_12',
      name: 'Brand_Assets_Archive_Q3.zip',
      extension: 'zip',
      mimeType: 'application/zip',
      category: 'archive',
      sizeBytes: Math.round(184 * MB),
      folderId: null,
      ownerId: elena.id,
      ownerName: elena.name,
      ownerEmail: elena.email,
      isFavorite: false,
      isTrashed: false,
      trashedAt: null,
      publicLinkEnabled: false,
      publicLinkToken: null,
      publicLinkPermission: 'viewer',
      publicLinkExpiresAt: null,
      shares: [],
      previewUrl: null,
      version: 1,
      createdAt: daysAgo(32),
      updatedAt: daysAgo(10),
    },
    // Trashed file
    {
      id: 'fil_13',
      name: 'Old_Wireframe_Draft_v1.pdf',
      extension: 'pdf',
      mimeType: 'application/pdf',
      category: 'document',
      sizeBytes: Math.round(9.4 * MB),
      folderId: 'fld_archive_old',
      ownerId: elena.id,
      ownerName: elena.name,
      ownerEmail: elena.email,
      isFavorite: false,
      isTrashed: true,
      trashedAt: daysAgo(2),
      publicLinkEnabled: false,
      publicLinkToken: null,
      publicLinkPermission: 'viewer',
      publicLinkExpiresAt: null,
      shares: [],
      previewUrl: null,
      textSnippet: 'Archived wireframe concept from Q1.',
      version: 1,
      createdAt: daysAgo(90),
      updatedAt: daysAgo(2),
    },
    // Shared with Elena by other users
    {
      id: 'fil_shared_1',
      name: 'Lyon_Retail_Flagship_Moodboard.jpg',
      extension: 'jpg',
      mimeType: 'image/jpeg',
      category: 'image',
      sizeBytes: Math.round(7.8 * MB),
      folderId: null,
      ownerId: 'usr_claire',
      ownerName: 'Claire Moreau',
      ownerEmail: 'claire@atelier-lyon.fr',
      isFavorite: true,
      isTrashed: false,
      trashedAt: null,
      publicLinkEnabled: true,
      publicLinkToken: 'cb_share_lyon_2026',
      publicLinkPermission: 'viewer',
      publicLinkExpiresAt: null,
      shares: [
        {
          id: 'shr_5',
          email: elena.email,
          name: elena.name,
          avatarUrl: elena.avatarUrl,
          permission: 'editor',
          addedAt: daysAgo(3),
        },
      ],
      previewUrl: '/src/assets/images/preview_design_deck_1795034769867.jpg',
      version: 2,
      createdAt: daysAgo(10),
      updatedAt: hoursAgo(6),
    },
    {
      id: 'fil_shared_2',
      name: 'Telemetry_Benchmark_Q4.csv',
      extension: 'csv',
      mimeType: 'text/csv',
      category: 'document',
      sizeBytes: Math.round(2.4 * MB),
      folderId: null,
      ownerId: 'usr_devon',
      ownerName: 'Devon Brooks',
      ownerEmail: 'devon@metriclabs.io',
      isFavorite: false,
      isTrashed: false,
      trashedAt: null,
      publicLinkEnabled: false,
      publicLinkToken: null,
      publicLinkPermission: 'viewer',
      publicLinkExpiresAt: null,
      shares: [
        {
          id: 'shr_6',
          email: elena.email,
          name: elena.name,
          avatarUrl: elena.avatarUrl,
          permission: 'viewer',
          addedAt: daysAgo(1),
        },
      ],
      previewUrl: null,
      textSnippet: 'Region,Throughput_MBps,P99_Latency_ms,Availability\nus-west-2,842,18,99.998\neu-central-1,790,22,99.997\nap-northeast-1,715,27,99.995',
      version: 1,
      createdAt: daysAgo(5),
      updatedAt: hoursAgo(9),
    },
  ];

  // Compute real storage used for Elena (plus realistic background baseline of 24.6 GB)
  const elenaFilesSize = files
    .filter((f) => f.ownerId === elena.id)
    .reduce((acc, f) => acc + f.sizeBytes, 0);
  elena.storageUsedBytes = Math.round(24.6 * GB) + elenaFilesSize;

  const activities: ActivityEvent[] = [
    {
      id: 'act_1',
      userId: elena.id,
      userName: elena.name,
      userEmail: elena.email,
      action: 'upload',
      targetName: 'CloudBox_Enterprise_Architecture.pdf',
      targetType: 'file',
      details: 'Uploaded version 4 (4.8 MB)',
      ipAddress: '192.168.14.22',
      createdAt: hoursAgo(2),
    },
    {
      id: 'act_2',
      userId: elena.id,
      userName: elena.name,
      userEmail: elena.email,
      action: 'share',
      targetName: 'Scandinavian_Studio_Lookbook.jpg',
      targetType: 'file',
      details: 'Shared with claire@atelier-lyon.fr as Viewer',
      ipAddress: '192.168.14.22',
      createdAt: hoursAgo(4),
    },
    {
      id: 'act_3',
      userId: 'usr_claire',
      userName: 'Claire Moreau',
      userEmail: 'claire@atelier-lyon.fr',
      action: 'share',
      targetName: 'Lyon_Retail_Flagship_Moodboard.jpg',
      targetType: 'file',
      details: 'Granted Editor access to Elena Vance',
      ipAddress: '84.19.201.44',
      createdAt: hoursAgo(6),
    },
    {
      id: 'act_4',
      userId: elena.id,
      userName: elena.name,
      userEmail: elena.email,
      action: 'rename',
      targetName: 'Q4_Revenue_Forecast_2026.csv',
      targetType: 'file',
      details: 'Updated forecast workbook inside Q4 Product Launches',
      ipAddress: '192.168.14.22',
      createdAt: hoursAgo(7),
    },
    {
      id: 'act_5',
      userId: admin.id,
      userName: admin.name,
      userEmail: admin.email,
      action: 'security_update',
      targetName: 'Tenant Encryption Policy',
      targetType: 'system',
      details: 'Enforced TLS 1.3 and automatic 2FA reminders across workspace',
      ipAddress: '10.0.4.11',
      createdAt: daysAgo(1),
    },
    {
      id: 'act_6',
      userId: elena.id,
      userName: elena.name,
      userEmail: elena.email,
      action: 'delete',
      targetName: 'Old_Wireframe_Draft_v1.pdf',
      targetType: 'file',
      details: 'Moved item to Trash',
      ipAddress: '192.168.14.22',
      createdAt: daysAgo(2),
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'ntf_1',
      userId: elena.id,
      title: 'Claire Moreau shared a file with you',
      message: 'You were granted Editor permissions on Lyon_Retail_Flagship_Moodboard.jpg.',
      type: 'share',
      isRead: false,
      link: '/dashboard/shared-with-me',
      createdAt: hoursAgo(6),
    },
    {
      id: 'ntf_2',
      userId: elena.id,
      title: 'Devon Brooks shared Telemetry_Benchmark_Q4.csv',
      message: 'Devon added you as a Viewer on the Q4 performance benchmark CSV.',
      type: 'share',
      isRead: false,
      link: '/dashboard/shared-with-me',
      createdAt: hoursAgo(9),
    },
    {
      id: 'ntf_3',
      userId: elena.id,
      title: 'Two-factor authentication verified',
      message: 'Your Pro workspace security audit passed with hardware-backed 2FA active.',
      type: 'security',
      isRead: true,
      link: '/dashboard/settings/security',
      createdAt: daysAgo(2),
    },
    {
      id: 'ntf_4',
      userId: elena.id,
      title: 'Storage snapshot complete',
      message: 'You are using 25.3% of your 100 GB CloudBox Pro quota.',
      type: 'storage',
      isRead: true,
      link: '/dashboard/storage',
      createdAt: daysAgo(4),
    },
  ];

  const sessions: UserSession[] = [
    {
      id: 'ses_1',
      userId: elena.id,
      device: 'MacBook Pro 16" (macOS 15.2)',
      browser: 'Chrome 131',
      location: 'San Francisco, US',
      ipAddress: '192.168.14.22',
      current: true,
      lastSeenAt: hoursAgo(0.1),
    },
    {
      id: 'ses_2',
      userId: elena.id,
      device: 'iPad Pro M4',
      browser: 'Safari Mobile',
      location: 'San Francisco, US',
      ipAddress: '172.16.88.14',
      current: false,
      lastSeenAt: daysAgo(1),
    },
    {
      id: 'ses_3',
      userId: admin.id,
      device: 'Linux Workstation',
      browser: 'Firefox 133',
      location: 'New York, US',
      ipAddress: '10.0.4.11',
      current: true,
      lastSeenAt: hoursAgo(0.1),
    },
  ];

  const subscriptions: SubscriptionRecord[] = [
    {
      id: 'sub_1',
      organization: 'Northwind Studio',
      ownerName: elena.name,
      ownerEmail: elena.email,
      plan: 'Pro',
      seats: 12,
      monthlyPriceUsd: 180,
      billingCycle: 'monthly',
      status: 'active',
      renewalDate: '2026-12-01',
      storageQuotaBytes: 100 * GB,
    },
    {
      id: 'sub_2',
      organization: 'Atelier Lyon',
      ownerName: 'Claire Moreau',
      ownerEmail: 'claire@atelier-lyon.fr',
      plan: 'Business',
      seats: 28,
      monthlyPriceUsd: 644,
      billingCycle: 'annual',
      status: 'active',
      renewalDate: '2027-02-15',
      storageQuotaBytes: 500 * GB,
    },
    {
      id: 'sub_3',
      organization: 'Metric Labs',
      ownerName: 'Devon Brooks',
      ownerEmail: 'devon@metriclabs.io',
      plan: 'Pro',
      seats: 8,
      monthlyPriceUsd: 120,
      billingCycle: 'monthly',
      status: 'active',
      renewalDate: '2026-11-28',
      storageQuotaBytes: 100 * GB,
    },
    {
      id: 'sub_4',
      organization: 'CloudBox Internal',
      ownerName: admin.name,
      ownerEmail: admin.email,
      plan: 'Enterprise',
      seats: 65,
      monthlyPriceUsd: 2600,
      billingCycle: 'annual',
      status: 'active',
      renewalDate: '2027-06-01',
      storageQuotaBytes: 1000 * GB,
    },
    {
      id: 'sub_5',
      organization: 'Kuroda Architects',
      ownerName: 'Hana Takahashi',
      ownerEmail: 'hana@kuroda-arch.jp',
      plan: 'Starter',
      seats: 3,
      monthlyPriceUsd: 0,
      billingCycle: 'monthly',
      status: 'past_due',
      renewalDate: '2026-11-10',
      storageQuotaBytes: 15 * GB,
    },
  ];

  const storageNodes: AdminStorageNode[] = [
    {
      id: 'node_us_west',
      region: 'us-west-2 (Oregon)',
      label: 'Primary Object Cluster A',
      usedBytes: 412 * GB,
      capacityBytes: 1024 * GB,
      status: 'healthy',
      latencyMs: 14,
    },
    {
      id: 'node_eu_central',
      region: 'eu-central-1 (Frankfurt)',
      label: 'EU Sovereign Vault B',
      usedBytes: 298 * GB,
      capacityBytes: 1024 * GB,
      status: 'healthy',
      latencyMs: 21,
    },
    {
      id: 'node_ap_ne',
      region: 'ap-northeast-1 (Tokyo)',
      label: 'APAC Edge Mirror C',
      usedBytes: 164 * GB,
      capacityBytes: 512 * GB,
      status: 'rebalancing',
      latencyMs: 29,
    },
  ];

  return {
    users: [elena, admin, ...extraUsers],
    folders,
    files,
    activities,
    notifications,
    sessions,
    subscriptions,
    storageNodes,
    contacts: [],
    refreshTokens: {},
    accessTokens: {},
    settings: {
      defaultUserQuotaGb: 15,
      maxUploadSizeMb: 500,
    },
  };
}

class Store {
  public state: DatabaseState;

  constructor() {
    this.state = this.load();
  }

  private load(): DatabaseState {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw) as DatabaseState;
      }
    } catch {
      // Fallback to fresh seed if corrupted
    }
    const seed = createSeedState();
    this.persist(seed);
    return seed;
  }

  public save(): void {
    this.persist(this.state);
  }

  private persist(data: DatabaseState): void {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // Ignore disk write errors in read-only sandboxes
    }
  }

  public sanitizeUser(user: StoredUser): User {
    const { passwordHash: _ph, verificationCode: _vc, resetToken: _rt, ...safe } = user;
    return safe;
  }

  public logActivity(entry: Omit<ActivityEvent, 'id' | 'createdAt'>): ActivityEvent {
    const event: ActivityEvent = {
      ...entry,
      id: `act_${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    this.state.activities.unshift(event);
    if (this.state.activities.length > 250) {
      this.state.activities = this.state.activities.slice(0, 250);
    }
    this.save();
    return event;
  }

  public recomputeFolderMetrics(folderId: string | null): void {
    if (!folderId) return;
    const folder = this.state.folders.find((f) => f.id === folderId);
    if (!folder) return;
    const childFiles = this.state.files.filter((f) => f.folderId === folderId && !f.isTrashed);
    const childFolders = this.state.folders.filter((f) => f.parentId === folderId && !f.isTrashed);
    folder.itemCount = childFiles.length + childFolders.length;
    folder.totalSizeBytes = childFiles.reduce((s, f) => s + f.sizeBytes, 0);
  }
}

export const db = new Store();

export function quotaForPlan(plan: PlanTier): number {
  switch (plan) {
    case 'Starter':
      return 15 * GB;
    case 'Pro':
      return 100 * GB;
    case 'Business':
      return 500 * GB;
    case 'Enterprise':
      return 1000 * GB;
  }
}
