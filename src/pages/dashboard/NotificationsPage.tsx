import { useState } from 'react';
import { Bell, Check, CheckCheck, HardDrive, Share2, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { TableSkeleton } from '@/src/components/common/SkeletonLoaders';
import { Button } from '@/src/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { useNotifications, useSettingsMutations } from '@/src/hooks/useDashboard';
import { cn, formatRelativeTime, getErrorMessage } from '@/src/lib/utils';
import type { NotificationItem } from '@/src/types';

const TYPE_ICON: Record<NotificationItem['type'], typeof Bell> = {
  share: Share2,
  storage: HardDrive,
  security: Shield,
  system: Bell,
};

export function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data, isLoading, isError, error, refetch } = useNotifications();
  const { markRead, markAllRead } = useSettingsMutations();

  if (isLoading) return <TableSkeleton rows={5} />;
  if (isError || !data) {
    return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;
  }

  const visible =
    filter === 'unread'
      ? data.notifications.filter((n) => !n.isRead)
      : data.notifications;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Stay informed about shared files, storage alerts, and security updates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
            <TabsList>
              <TabsTrigger value="all">All ({data.notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({data.unreadCount})</TabsTrigger>
            </TabsList>
          </Tabs>
          {data.unreadCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          ) : null}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You are all caught up"
          description={
            filter === 'unread'
              ? 'No unread notifications remaining.'
              : 'New workspace alerts and share invitations will appear here.'
          }
        />
      ) : (
        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {visible.map((item) => {
            const Icon = TYPE_ICON[item.type] || Bell;
            return (
              <div
                key={item.id}
                className={cn(
                  'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between',
                  !item.isRead && 'bg-blue-50/35',
                )}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={cn(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                      !item.isRead
                        ? 'border-blue-200 bg-blue-50 text-blue-600'
                        : 'border-slate-200 bg-slate-50 text-slate-500',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{item.message}</p>
                    <p className="mt-1 text-xs text-slate-400 tabular-nums">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pl-12 sm:pl-0">
                  {item.link ? (
                    <Button asChild variant="outline" size="sm">
                      <Link to={item.link}>Open</Link>
                    </Button>
                  ) : null}
                  {!item.isRead ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => markRead.mutate(item.id)}
                    >
                      <Check className="h-4 w-4" />
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
