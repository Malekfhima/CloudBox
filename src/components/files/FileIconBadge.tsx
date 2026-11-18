import {
  FileArchive,
  FileAudio,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  File as GenericFile,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { FileCategory } from '@/src/types';

export function FileIconBadge({
  category,
  extension,
  className,
}: {
  category: FileCategory;
  extension?: string;
  className?: string;
}) {
  const ext = extension?.toLowerCase();
  if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
    return (
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600',
          className,
        )}
      >
        <FileSpreadsheet className="h-5 w-5" />
      </div>
    );
  }

  switch (category) {
    case 'image':
      return (
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600',
            className,
          )}
        >
          <FileImage className="h-5 w-5" />
        </div>
      );
    case 'video':
      return (
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600',
            className,
          )}
        >
          <FileVideo className="h-5 w-5" />
        </div>
      );
    case 'audio':
      return (
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600',
            className,
          )}
        >
          <FileAudio className="h-5 w-5" />
        </div>
      );
    case 'archive':
      return (
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600',
            className,
          )}
        >
          <FileArchive className="h-5 w-5" />
        </div>
      );
    case 'code':
      return (
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700',
            className,
          )}
        >
          <FileCode2 className="h-5 w-5" />
        </div>
      );
    case 'document':
      return (
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600',
            className,
          )}
        >
          <FileText className="h-5 w-5" />
        </div>
      );
    default:
      return (
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600',
            className,
          )}
        >
          <GenericFile className="h-5 w-5" />
        </div>
      );
  }
}
