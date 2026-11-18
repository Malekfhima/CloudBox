export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending';
export type PlanTier = 'Starter' | 'Pro' | 'Business' | 'Enterprise';
export type FileCategory = 'document' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'other';
export type SharePermission = 'viewer' | 'editor' | 'owner';
export type FileScope =
  | 'my-files'
  | 'recent'
  | 'shared-with-me'
  | 'shared-by-me'
  | 'favorites'
  | 'trash';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  plan: PlanTier;
  title: string;
  company: string;
  timezone: string;
  avatarUrl: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  sessionTimeoutMinutes: number;
  loginAlertsEnabled: boolean;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  createdAt: string;
  lastActiveAt: string;
}

export interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  ownerId: string;
  ownerName: string;
  isFavorite: boolean;
  isTrashed: boolean;
  trashedAt: string | null;
  itemCount: number;
  totalSizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface FileShareEntry {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  permission: SharePermission;
  addedAt: string;
}

export interface FileItem {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  category: FileCategory;
  sizeBytes: number;
  folderId: string | null;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  isFavorite: boolean;
  isTrashed: boolean;
  trashedAt: string | null;
  sharedWithMe?: boolean;
  sharedPermission?: SharePermission;
  publicLinkEnabled: boolean;
  publicLinkToken: string | null;
  publicLinkPermission: 'viewer' | 'editor';
  publicLinkExpiresAt: string | null;
  shares: FileShareEntry[];
  previewUrl: string | null;
  textSnippet?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface BreadcrumbNode {
  id: string | null;
  name: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FilesQueryResponse {
  items: FileItem[];
  folders: FolderItem[];
  breadcrumbs: BreadcrumbNode[];
  pagination: PaginationMeta;
}

export interface ActivityEvent {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action:
    | 'upload'
    | 'download'
    | 'rename'
    | 'move'
    | 'copy'
    | 'share'
    | 'delete'
    | 'restore'
    | 'favorite'
    | 'folder_create'
    | 'login'
    | 'security_update'
    | 'plan_change';
  targetName: string;
  targetType: 'file' | 'folder' | 'account' | 'system';
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'share' | 'storage' | 'security' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  current: boolean;
  lastSeenAt: string;
}

export interface StorageCategoryBreakdown {
  category: string;
  bytes: number;
  count: number;
  color: string;
}

export interface StorageHistoryPoint {
  month: string;
  usedGb: number;
  uploads: number;
}

export interface DashboardOverview {
  user: User;
  totalFiles: number;
  totalFolders: number;
  sharedFilesCount: number;
  trashedCount: number;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  categoryBreakdown: StorageCategoryBreakdown[];
  storageHistory: StorageHistoryPoint[];
  recentActivity: ActivityEvent[];
  recentFiles: FileItem[];
}

export interface StorageUsageDetails {
  storageUsedBytes: number;
  storageQuotaBytes: number;
  plan: PlanTier;
  categoryBreakdown: StorageCategoryBreakdown[];
  storageHistory: StorageHistoryPoint[];
  largestFiles: FileItem[];
}

export interface SubscriptionRecord {
  id: string;
  organization: string;
  ownerName: string;
  ownerEmail: string;
  plan: PlanTier;
  seats: number;
  monthlyPriceUsd: number;
  billingCycle: 'monthly' | 'annual';
  status: 'active' | 'past_due' | 'canceled';
  renewalDate: string;
  storageQuotaBytes: number;
}

export interface AdminOverviewData {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalFiles: number;
  totalFolders: number;
  totalStorageUsedBytes: number;
  totalStorageAllocatedBytes: number;
  monthlyRecurringRevenueUsd: number;
  dailyActivitySeries: { day: string; uploads: number; downloads: number; shares: number }[];
  planDistribution: { plan: string; users: number; revenue: number }[];
  recentLogs: ActivityEvent[];
}

export interface AdminStorageNode {
  id: string;
  region: string;
  label: string;
  usedBytes: number;
  capacityBytes: number;
  status: 'healthy' | 'rebalancing';
  latencyMs: number;
}

export interface AdminStorageData {
  nodes: AdminStorageNode[];
  topConsumers: User[];
  defaultUserQuotaGb: number;
  maxUploadSizeMb: number;
}

export interface AdminSystemStats {
  uptimePercent: number;
  avgApiLatencyMs: number;
  requestsPerMinute: number;
  errorRatePercent: number;
  bandwidthSeries: { time: string; ingressGb: number; egressGb: number; latencyMs: number }[];
  endpointMetrics: { endpoint: string; calls24h: number; p95Ms: number; errorRate: number }[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
