import { HardDrive } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Progress } from '@/src/components/ui/progress';
import { formatBytes } from '@/src/lib/utils';

interface StorageUsageCardProps {
  usedBytes: number;
  quotaBytes: number;
  plan?: string;
  compact?: boolean;
}

export function StorageUsageCard({
  usedBytes,
  quotaBytes,
  plan = 'Pro',
  compact = false,
}: StorageUsageCardProps) {
  const pct = quotaBytes > 0 ? Math.min(100, Math.round((usedBytes / quotaBytes) * 100)) : 0;
  const isNearLimit = pct >= 85;

  if (compact) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700">Storage ({plan})</span>
          <span className="font-mono text-slate-500 tabular-nums">{pct}%</span>
        </div>
        <Progress
          value={pct}
          indicatorClassName={isNearLimit ? 'bg-amber-500' : 'bg-blue-600'}
        />
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500 tabular-nums">
          <span>
            {formatBytes(usedBytes)} of {formatBytes(quotaBytes, 0)}
          </span>
          <Link to="/dashboard/storage" className="font-medium text-blue-600 hover:underline">
            Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <HardDrive className="h-4.5 w-4.5" />
          </div>
          <div>
            <CardTitle>Storage Allocation</CardTitle>
            <p className="text-xs text-slate-500">{plan} workspace tier</p>
          </div>
        </div>
        <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">{pct}%</span>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress
          value={pct}
          className="h-2.5"
          indicatorClassName={isNearLimit ? 'bg-amber-500' : 'bg-blue-600'}
        />
        <div className="flex items-center justify-between text-sm text-slate-600 tabular-nums">
          <span>{formatBytes(usedBytes)} used</span>
          <span>{formatBytes(Math.max(0, quotaBytes - usedBytes))} available</span>
        </div>
      </CardContent>
    </Card>
  );
}
