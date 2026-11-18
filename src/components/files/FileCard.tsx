import { useState } from 'react';
import {
  Copy,
  Download,
  Eye,
  FolderInput,
  MoreVertical,
  Pencil,
  RotateCcw,
  Share2,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { Checkbox } from '@/src/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { FileIconBadge } from './FileIconBadge';
import { cn, formatBytes, formatRelativeTime } from '@/src/lib/utils';
import type { FileItem } from '@/src/types';

interface FileCardProps {
  file: FileItem;
  selected: boolean;
  isTrash?: boolean;
  onSelectChange: (checked: boolean) => void;
  onPreview: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onMove: (file: FileItem) => void;
  onCopy: (file: FileItem) => void;
  onToggleFavorite: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onRestore?: (file: FileItem) => void;
}

export function FileCard({
  file,
  selected,
  isTrash = false,
  onSelectChange,
  onPreview,
  onDownload,
  onShare,
  onRename,
  onMove,
  onCopy,
  onToggleFavorite,
  onDelete,
  onRestore,
}: FileCardProps) {
  const [imgError, setImgError] = useState(false);
  const hasImagePreview = Boolean(file.previewUrl) && !imgError;

  return (
    <div
      className={cn(
        'group flex flex-col rounded-xl border bg-white p-3 transition-all duration-150 hover:border-slate-300',
        selected ? 'border-blue-600 bg-blue-50/25 ring-1 ring-blue-600' : 'border-slate-200',
      )}
    >
      {/* Preview Surface */}
      <div className="relative mb-3 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
        <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5">
          <div className="rounded bg-white/90 p-0.5 shadow-xs backdrop-blur-xs">
            <Checkbox
              checked={selected}
              onCheckedChange={(v) => onSelectChange(Boolean(v))}
              aria-label={`Select ${file.name}`}
            />
          </div>
        </div>

        {!isTrash ? (
          <button
            type="button"
            onClick={() => onToggleFavorite(file)}
            aria-label={file.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={cn(
              'absolute right-2.5 top-2.5 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/90 shadow-xs backdrop-blur-xs transition-colors hover:bg-white',
              file.isFavorite ? 'text-amber-500' : 'text-slate-400 opacity-0 group-hover:opacity-100',
            )}
          >
            <Star className={cn('h-3.5 w-3.5', file.isFavorite && 'fill-amber-400')} />
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => onPreview(file)}
          className="flex h-36 w-full items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          {hasImagePreview ? (
            <img
              src={file.previewUrl!}
              alt={file.name}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 px-4 text-center">
              <FileIconBadge category={file.category} extension={file.extension} className="h-12 w-12" />
              <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {file.extension}
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Footer Info */}
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onPreview(file)}
          className="min-w-0 flex-1 text-left focus-visible:outline-none"
        >
          <p className="truncate text-sm font-semibold text-slate-900" title={file.name}>
            {file.name}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
            <span>{formatBytes(file.sizeBytes)}</span>
            <span aria-hidden="true">·</span>
            <span>{formatRelativeTime(file.updatedAt)}</span>
            {file.shares.length > 0 || file.publicLinkEnabled ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-blue-600">
                  <Users className="h-3 w-3" />
                  Shared
                </span>
              </>
            ) : null}
          </p>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`More actions for ${file.name}`}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPreview(file)}>
              <Eye className="h-4 w-4" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(file)}>
              <Download className="h-4 w-4" />
              Download
            </DropdownMenuItem>
            {!isTrash ? (
              <>
                <DropdownMenuItem onClick={() => onShare(file)}>
                  <Share2 className="h-4 w-4" />
                  Share & Permissions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onRename(file)}>
                  <Pencil className="h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMove(file)}>
                  <FolderInput className="h-4 w-4" />
                  Move to...
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopy(file)}>
                  <Copy className="h-4 w-4" />
                  Make a copy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleFavorite(file)}>
                  <Star className="h-4 w-4" />
                  {file.isFavorite ? 'Remove favorite' : 'Add to favorites'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onClick={() => onDelete(file)}>
                  <Trash2 className="h-4 w-4" />
                  Move to Trash
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuSeparator />
                {onRestore ? (
                  <DropdownMenuItem onClick={() => onRestore(file)}>
                    <RotateCcw className="h-4 w-4" />
                    Restore file
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem destructive onClick={() => onDelete(file)}>
                  <Trash2 className="h-4 w-4" />
                  Delete permanently
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
