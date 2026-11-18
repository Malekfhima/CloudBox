import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { Progress } from '@/src/components/ui/progress';
import { formatBytes } from '@/src/lib/utils';
import { useUiStore } from '@/src/store/uiStore';

export function UploadProgress() {
  const { uploads, clearCompletedUploads } = useUiStore();
  if (uploads.length === 0) return null;

  const activeCount = uploads.filter((u) => u.status === 'uploading').length;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[calc(100%-2rem)] max-w-sm rounded-xl border border-slate-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <span className="text-xs font-semibold text-slate-800">
          {activeCount > 0 ? `Uploading ${activeCount} file(s)...` : 'Recent uploads'}
        </span>
        {activeCount === 0 ? (
          <button
            type="button"
            onClick={clearCompletedUploads}
            aria-label="Dismiss upload list"
            className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      <div className="max-h-56 divide-y divide-slate-100 overflow-y-auto px-4 py-1">
        {uploads.map((task) => (
          <div key={task.id} className="py-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                {task.status === 'uploading' ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" />
                ) : task.status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                )}
                <span className="truncate text-xs font-medium text-slate-800">
                  {task.fileName}
                </span>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-slate-500 tabular-nums">
                {task.status === 'uploading' ? `${task.progress}%` : formatBytes(task.sizeBytes)}
              </span>
            </div>
            {task.status === 'uploading' ? <Progress value={task.progress} className="h-1.5" /> : null}
            {task.errorMessage ? (
              <p className="text-[11px] text-red-600">{task.errorMessage}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
