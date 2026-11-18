import { useState } from 'react';
import { ErrorState } from '@/src/components/common/ErrorState';
import { TableSkeleton } from '@/src/components/common/SkeletonLoaders';
import { SearchBar } from '@/src/components/files/SearchBar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { useAdminLogs } from '@/src/hooks/useAdmin';
import { formatDate, formatRelativeTime, getErrorMessage } from '@/src/lib/utils';

export function ActivityLogsPage() {
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading, isError, error, refetch } = useAdminLogs({
    action: actionFilter,
    search: search || undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Activity Logs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Immutable audit trail covering uploads, shares, deletions, and security changes.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Filter by user, target file, or details..."
          className="w-full sm:max-w-sm"
        />
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All event types</SelectItem>
            <SelectItem value="upload">Uploads</SelectItem>
            <SelectItem value="download">Downloads</SelectItem>
            <SelectItem value="share">Shares</SelectItem>
            <SelectItem value="rename">Renames</SelectItem>
            <SelectItem value="delete">Deletions</SelectItem>
            <SelectItem value="restore">Restorations</SelectItem>
            <SelectItem value="security_update">Security updates</SelectItem>
            <SelectItem value="login">Sign-ins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actor</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Target</TableHead>
                <TableHead className="hidden md:table-cell">Details</TableHead>
                <TableHead className="hidden lg:table-cell">IP Address</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <p className="font-medium text-slate-900">{log.userName}</p>
                    <p className="text-xs text-slate-500">{log.userEmail}</p>
                  </TableCell>
                  <TableCell className="font-mono text-xs uppercase text-blue-700">
                    {log.action.replace('_', ' ')}
                  </TableCell>
                  <TableCell className="font-medium text-slate-800 max-w-[180px] truncate">
                    {log.targetName}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-slate-600">
                    {log.details}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-xs text-slate-500 tabular-nums">
                    {log.ipAddress}
                  </TableCell>
                  <TableCell className="text-right text-xs text-slate-500 tabular-nums">
                    <span title={formatDate(log.createdAt)}>{formatRelativeTime(log.createdAt)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
