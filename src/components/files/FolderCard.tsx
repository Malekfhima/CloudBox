import { Folder, MoreVertical, Pencil, RotateCcw, Star, Trash2 } from 'lucide-react';
import { Checkbox } from '@/src/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { cn, formatBytes, formatRelativeTime } from '@/src/lib/utils';
import type { FolderItem } from '@/src/types';

interface FolderCardProps {
  folder: FolderItem;
  selected: boolean;
  isTrash?: boolean;
  onSelectChange: (checked: boolean) => void;
  onOpen: (folder: FolderItem) => void;
  onRename: (folder: FolderItem) => void;
  onToggleFavorite: (folder: FolderItem) => void;
  onDelete: (folder: FolderItem) => void;
  onRestore?: (folder: FolderItem) => void;
}

export function FolderCard({
  folder,
  selected,
  isTrash = false,
  onSelectChange,
  onOpen,
  onRename,
  onToggleFavorite,
  onDelete,
  onRestore,
}: FolderCardProps) {
  return (
    <div
      className={cn(
        'group relative flex items-center justify-between gap-3 rounded-xl border bg-white p-3.5 transition-all duration-150 hover:border-slate-300',
        selected ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600' : 'border-slate-200',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={(v) => onSelectChange(Boolean(v))}
          aria-label={`Select folder ${folder.name}`}
        />
        <button
          type="button"
          onClick={() => (!isTrash ? onOpen(folder) : undefined)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Folder className="h-5 w-5 fill-blue-600/15" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{folder.name}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
              <span>{folder.itemCount} items</span>
              <span aria-hidden="true">·</span>
              <span>{formatBytes(folder.totalSizeBytes)}</span>
              <span aria-hidden="true">·</span>
              <span>{formatRelativeTime(folder.updatedAt)}</span>
            </p>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!isTrash ? (
          <button
            type="button"
            onClick={() => onToggleFavorite(folder)}
            aria-label={folder.isFavorite ? 'Remove folder from favorites' : 'Favorite folder'}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-slate-100',
              folder.isFavorite ? 'text-amber-500' : 'text-slate-300 group-hover:text-slate-400',
            )}
          >
            <Star className={cn('h-4 w-4', folder.isFavorite && 'fill-amber-400')} />
          </button>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${folder.name}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isTrash ? (
              <>
                <DropdownMenuItem onClick={() => onOpen(folder)}>
                  <Folder className="h-4 w-4" />
                  Open folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRename(folder)}>
                  <Pencil className="h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleFavorite(folder)}>
                  <Star className="h-4 w-4" />
                  {folder.isFavorite ? 'Remove favorite' : 'Add to favorites'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onClick={() => onDelete(folder)}>
                  <Trash2 className="h-4 w-4" />
                  Move to Trash
                </DropdownMenuItem>
              </>
            ) : (
              <>
                {onRestore ? (
                  <DropdownMenuItem onClick={() => onRestore(folder)}>
                    <RotateCcw className="h-4 w-4" />
                    Restore folder
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem destructive onClick={() => onDelete(folder)}>
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
