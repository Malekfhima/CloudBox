import { CreditCard, FileStack, HardDrive, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ErrorState } from '@/src/components/common/ErrorState';
import { DashboardSkeleton } from '@/src/components/common/SkeletonLoaders';
import { ActivityTimeline } from '@/src/components/files/ActivityTimeline';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { useAdminOverview } from '@/src/hooks/useAdmin';
import { formatBytes, getErrorMessage } from '@/src/lib/utils';

export function AdminOverviewPage() {
  const { data, isLoading, isError, error, refetch } = useAdminOverview();

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) {
    return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Admin Overview</h1>
          <p className="mt-1 text-sm text-slate-500">
            Organization-wide tenant health, storage utilization, and subscription revenue.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/users">Manage users</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/admin/logs">Audit logs</Link>
          </Button>
        </div>
      </div>

      {/* 4 Admin KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Users</span>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-950 tabular-nums">
              {data.totalUsers}
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {data.activeUsers} active · {data.suspendedUsers} suspended
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Tenant Storage Used</span>
              <HardDrive className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-950 tabular-nums">
              {formatBytes(data.totalStorageUsedBytes)}
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              of {formatBytes(data.totalStorageAllocatedBytes, 0)} allocated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Stored Objects</span>
              <FileStack className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-950 tabular-nums">
              {data.totalFiles + data.totalFolders}
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {data.totalFiles} files · {data.totalFolders} folders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active MRR</span>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-950 tabular-nums">
              ${data.monthlyRecurringRevenueUsd.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">Monthly recurring revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts + Logs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Workspace Throughput</CardTitle>
            <CardDescription>Daily uploads, downloads, and share events across all users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dailyActivitySeries} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="uploads" name="Uploads" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="downloads" name="Downloads" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="shares" name="Shares" fill="#0F172A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Accounts and monthly revenue by tier</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {data.planDistribution.map((row) => (
              <div key={row.plan} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{row.plan}</p>
                  <p className="text-xs text-slate-500 tabular-nums">{row.users} users</p>
                </div>
                <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  ${row.revenue.toLocaleString()}/mo
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Latest Audit Events</CardTitle>
            <CardDescription>Real-time actions logged across user accounts</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/logs">View full log</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ActivityTimeline events={data.recentLogs} />
        </CardContent>
      </Card>
    </div>
  );
}
