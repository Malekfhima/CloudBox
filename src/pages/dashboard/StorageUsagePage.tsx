import { Download, Trash2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { filesApi } from '@/src/api/files.api';
import { ErrorState } from '@/src/components/common/ErrorState';
import { DashboardSkeleton } from '@/src/components/common/SkeletonLoaders';
import { FileIconBadge } from '@/src/components/files/FileIconBadge';
import { StorageUsageCard } from '@/src/components/files/StorageUsageCard';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { useStorageUsage } from '@/src/hooks/useDashboard';
import { useFileMutations } from '@/src/hooks/useFiles';
import { formatBytes, formatDate, getErrorMessage } from '@/src/lib/utils';

export function StorageUsagePage() {
  const { data, isLoading, isError, error, refetch } = useStorageUsage();
  const mutations = useFileMutations();

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) {
    return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;
  }

  const pieData = data.categoryBreakdown.map((item) => ({
    name: item.category,
    value: Math.max(1, Math.round(item.bytes / (1024 * 1024))),
    color: item.color,
    rawBytes: item.bytes,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Storage Usage</h1>
        <p className="mt-1 text-sm text-slate-500">
          Inspect quota allocation, file type distribution, and largest stored objects.
        </p>
      </div>

      <StorageUsageCard
        usedBytes={data.storageUsedBytes}
        quotaBytes={data.storageQuotaBytes}
        plan={data.plan}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribution by File Category</CardTitle>
            <CardDescription>Megabytes consumed per media classification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => `${val ?? 0} MB`}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
              {data.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: cat.color }} />
                    {cat.category}
                  </span>
                  <span className="font-mono font-medium text-slate-900 tabular-nums">
                    {formatBytes(cat.bytes)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Upload Volume</CardTitle>
            <CardDescription>File uploads recorded per month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.storageHistory} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="uploads" name="Files Uploaded" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Largest Files */}
      <Card>
        <CardHeader>
          <CardTitle>Largest Files in Workspace</CardTitle>
          <CardDescription>Clean up or archive large assets to free storage space</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="hidden md:table-cell">Updated</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.largestFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <FileIconBadge category={file.category} extension={file.extension} className="h-8 w-8" />
                      <span className="truncate max-w-[200px] sm:max-w-xs font-medium text-slate-900">
                        {file.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell capitalize text-slate-500">
                    {file.category}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-slate-500 tabular-nums">
                    {formatDate(file.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold text-slate-900 tabular-nums">
                    {formatBytes(file.sizeBytes)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Download ${file.name}`}
                        onClick={() => filesApi.downloadFile(file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Move ${file.name} to Trash`}
                        onClick={() => mutations.deleteFile.mutate({ id: file.id, permanent: false })}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
