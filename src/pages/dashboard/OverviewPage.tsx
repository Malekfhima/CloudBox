import { useState } from 'react';
import {
  Download,
  Eye,
  FileText,
  Folder,
  FolderPlus,
  HardDrive,
  Share2,
  Upload,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { filesApi } from '@/src/api/files.api';
import { ErrorState } from '@/src/components/common/ErrorState';
import { DashboardSkeleton } from '@/src/components/common/SkeletonLoaders';
import { ActivityTimeline } from '@/src/components/files/ActivityTimeline';
import { FileIconBadge } from '@/src/components/files/FileIconBadge';
import { FilePreviewModal } from '@/src/components/files/FilePreviewModal';
import { ShareModal } from '@/src/components/files/ShareModal';
import { StorageUsageCard } from '@/src/components/files/StorageUsageCard';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { useDashboardOverview } from '@/src/hooks/useDashboard';
import { useFileMutations } from '@/src/hooks/useFiles';
import { formatBytes, formatRelativeTime, getErrorMessage } from '@/src/lib/utils';
import { useUiStore } from '@/src/store/uiStore';
import type { FileItem } from '@/src/types';

export function OverviewPage() {
  const navigate = useNavigate();
  const { openUploadModal } = useUiStore();
  const { data, isLoading, isError, error, refetch } = useDashboardOverview();
  const mutations = useFileMutations();
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) {
    return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;
  }

  const firstName = data.user.name.split(' ')[0];
  const pctUsed =
    data.storageQuotaBytes > 0
      ? Math.round((data.storageUsedBytes / data.storageQuotaBytes) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here is an overview of your CloudBox workspace storage, shared files, and activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button type="button" variant="outline" onClick={() => navigate('/dashboard/files')}>
            <FolderPlus className="h-4 w-4" />
            Manage folders
          </Button>
          <Button type="button" onClick={() => openUploadModal(null)}>
            <Upload className="h-4 w-4" />
            Upload files
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Files</span>
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-950 tabular-nums">
              {data.totalFiles}
            </p>
            <p className="mt-1 text-xs text-slate-500">Active documents &amp; media</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Folders</span>
              <Folder className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-950 tabular-nums">
              {data.totalFolders}
            </p>
            <p className="mt-1 text-xs text-slate-500">Organized directories</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Shared Files</span>
              <Share2 className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-950 tabular-nums">
              {data.sharedFilesCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">Collaborator or link active</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Storage Used</span>
              <HardDrive className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-950 tabular-nums">
              {formatBytes(data.storageUsedBytes)}
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {pctUsed}% of {formatBytes(data.storageQuotaBytes, 0)} quota
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts + Storage Card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Storage Utilization Trend</CardTitle>
            <CardDescription>Cumulative workspace storage (GB) over the past 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.storageHistory} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cloudboxBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} unit=" GB" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="usedGb"
                    name="Used (GB)"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#cloudboxBlue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <StorageUsageCard
            usedBytes={data.storageUsedBytes}
            quotaBytes={data.storageQuotaBytes}
            plan={data.user.plan}
          />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-slate-700">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs text-slate-500 tabular-nums">
                    <span>{cat.count} files</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-800">{formatBytes(cat.bytes)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Files + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recently Uploaded &amp; Modified</CardTitle>
              <CardDescription>Quick access to your latest files</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/files">View all files</Link>
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {data.recentFiles.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No files uploaded yet. Upload a file to see it here.
              </p>
            ) : (
              data.recentFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => setPreviewFile(file)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <FileIconBadge category={file.category} extension={file.extension} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 hover:text-blue-600">
                        {file.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                        {formatBytes(file.sizeBytes)} · Updated {formatRelativeTime(file.updatedAt)}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Preview ${file.name}`}
                      onClick={() => setPreviewFile(file)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Download ${file.name}`}
                      onClick={() => filesApi.downloadFile(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest file and security events</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityTimeline events={data.recentActivity} />
          </CardContent>
        </Card>
      </div>

      <FilePreviewModal
        file={previewFile}
        onOpenChange={(open) => (!open ? setPreviewFile(null) : undefined)}
        onDownload={(f) => filesApi.downloadFile(f)}
        onShare={(f) => {
          setPreviewFile(null);
          setShareFile(f);
        }}
        onToggleFavorite={(f) => {
          mutations.toggleFavorite.mutate({ id: f.id, isFavorite: !f.isFavorite });
          setPreviewFile({ ...f, isFavorite: !f.isFavorite });
        }}
      />

      <ShareModal
        file={shareFile}
        onOpenChange={(open) => (!open ? setShareFile(null) : undefined)}
        onUpdated={(updated) => setShareFile(updated)}
      />
    </div>
  );
}
