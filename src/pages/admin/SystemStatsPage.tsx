import { Activity, Gauge, Server, ShieldAlert } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ErrorState } from '@/src/components/common/ErrorState';
import { DashboardSkeleton } from '@/src/components/common/SkeletonLoaders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { useAdminStats } from '@/src/hooks/useAdmin';
import { getErrorMessage } from '@/src/lib/utils';

export function SystemStatsPage() {
  const { data, isLoading, isError, error, refetch } = useAdminStats();

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) {
    return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">System Statistics</h1>
        <p className="mt-1 text-sm text-slate-500">
          API performance, ingress/egress bandwidth, and endpoint reliability metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Uptime (30d)</span>
              <Server className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-950 tabular-nums">
              {data.uptimePercent}%
            </p>
            <p className="mt-1 text-xs text-slate-500">Multi-AZ availability</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Avg API Latency</span>
              <Gauge className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-950 tabular-nums">
              {data.avgApiLatencyMs} ms
            </p>
            <p className="mt-1 text-xs text-slate-500">Global edge median</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Throughput</span>
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-950 tabular-nums">
              {data.requestsPerMinute.toLocaleString()} rpm
            </p>
            <p className="mt-1 text-xs text-slate-500">Authenticated requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Error Rate</span>
              <ShieldAlert className="h-4 w-4 text-slate-500" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-950 tabular-nums">
              {data.errorRatePercent}%
            </p>
            <p className="mt-1 text-xs text-slate-500">5xx responses over 24h</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Network Bandwidth (24h)</CardTitle>
          <CardDescription>Object ingress and egress volume in gigabytes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.bandwidthSeries} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} unit=" GB" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="egressGb" name="Egress (GB)" stroke="#2563EB" fill="#DBEAFE" />
                <Area type="monotone" dataKey="ingressGb" name="Ingress (GB)" stroke="#0F172A" fill="#E2E8F0" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Endpoint Performance</CardTitle>
          <CardDescription>24-hour call volume and p95 latency across core REST endpoints</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead className="text-right">24h Calls</TableHead>
                <TableHead className="text-right">p95 Latency</TableHead>
                <TableHead className="text-right">Error Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.endpointMetrics.map((ep) => (
                <TableRow key={ep.endpoint}>
                  <TableCell className="font-mono text-xs font-medium text-slate-900">
                    {ep.endpoint}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-700 tabular-nums">
                    {ep.calls24h.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-700 tabular-nums">
                    {ep.p95Ms} ms
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-700 tabular-nums">
                    {ep.errorRate}%
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
