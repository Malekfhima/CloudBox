import {
  Download,
  FolderPlus,
  Heart,
  Pencil,
  RotateCcw,
  Share2,
  Shield,
  Trash2,
  Upload,
} from 'lucide-react';
import { formatRelativeTime } from '@/src/lib/utils';
import type { ActivityEvent } from '@/src/types';

const ACTION_ICON: Record<ActivityEvent['action'], typeof Upload> = {
  upload: Upload,
  download: Download,
  rename: Pencil,
  move: FolderPlus,
  copy: FolderPlus,
  share: Share2,
  delete: Trash2,
  restore: RotateCcw,
  favorite: Heart,
  folder_create: FolderPlus,
  login: Shield,
  security_update: Shield,
  plan_change: Shield,
};

export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No recent workspace activity recorded.
      </p>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {events.map((evt) => {
        const Icon = ACTION_ICON[evt.action] || Upload;
        return (
          <div key={evt.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-800">
                <span className="font-medium text-slate-900">{evt.userName}</span>{' '}
                <span className="text-slate-600">{evt.details.toLowerCase()}</span>
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <span className="truncate font-medium text-slate-700">{evt.targetName}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{formatRelativeTime(evt.createdAt)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
