import {
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  Eye,
  Folder,
  FolderInput,
  MoreHorizontal,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { FileIconBadge } from './FileIconBadge';
import { cn, formatBytes, formatDate } from '@/src/lib/utils';
import type { FileItem, FolderItem } from '@/src/types';

interface FileTableProps {
  folders: FolderItem[];
  files: FileItem[];
  selectedFileIds: string[];
  selectedFolderIds: string[];
  sortBy: 'name' | 'size' | 'updatedAt';
  sortDir: 'asc' | 'desc';
  isTrash?: boolean;
  onSortChange: (col: 'name' | 'size' | 'updatedAt') => void;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleFileSelect: (id: string, checked: boolean) => void;
  onToggleFolderSelect: (id: string, checked: boolean) => void;
  onOpenFolder: (folder: FolderItem) => void;
  onRenameFolder: (folder: FolderItem) => void;
  onDeleteFolder: (folder: FolderItem) => void;
  onRestoreFolder?: (folder: FolderItem) => void;
  onPreviewFile: (file: FileItem) => void;
  onDownloadFile: (file: FileItem) => void;
  onShareFile: (file: FileItem) => void;
  onRenameFile: (file: FileItem) => void;
  onMoveFile: (file: FileItem) => void;
  onCopyFile: (file: FileItem) => void;
  onToggleFavoriteFile: (file: FileItem) => void;
  onDeleteFile: (file: FileItem) => void;
  onRestoreFile?: (file: FileItem) => void;
}

export function FileTable({
  folders,
  files,
  selectedFileIds,
  selectedFolderIds,
  sortBy,
  sortDir,
  isTrash = false,
  onSortChange,
  onToggleSelectAll,
  onToggleFileSelect,
  onToggleFolderSelect,
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
  onRestoreFolder,
  onPreviewFile,
  onDownloadFile,
  onShareFile,
  onRenameFile,
  onMoveFile,
  onCopyFile,
  onToggleFavoriteFile,
  onDeleteFile,
  onRestoreFile,
}: FileTableProps) {
  const totalCount = folders.length + files.length;
  const allSelected =
    totalCount > 0 &&
    selectedFileIds.length === files.length &&
    selectedFolderIds.length === folders.length;

  const renderSortIcon = (col: 'name' | 'size' | 'updatedAt') => {
    if (sortBy !== col) return null;
    return sortDir === 'asc' ? (
      <ArrowUp className="ml-1 inline h-3.5 w-3.5 text-blue-600" />
    ) : (
      <ArrowDown className="ml-1 inline h-3.5 w-3.5 text-blue-600" />
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(v) => onToggleSelectAll(Boolean(v))}
                aria-label="Select all items"
              />
            </TableHead>
            <TableHead>
              <button
                type="button"
                onClick={() => onSortChange('name')}
                className="inline-flex items-center font-semibold text-slate-600 hover:text-slate-900"
              >
                Name {renderSortIcon('name')}
              </button>
            </TableHead>
            <TableHead className="hidden md:table-cell">Owner</TableHead>
            <TableHead className="hidden sm:table-cell text-right">
              <button
                type="button"
                onClick={() => onSortChange('size')}
                className="inline-flex items-center font-semibold text-slate-600 hover:text-slate-900"
              >
                Size {renderSortIcon('size')}
              </button>
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              <button
                type="button"
                onClick={() => onSortChange('updatedAt')}
                className="inline-flex items-center font-semibold text-slate-600 hover:text-slate-900"
              >
                Modified {renderSortIcon('updatedAt')}
              </button>
            </TableHead>
            <TableHead className="w-20 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {folders.map((folder) => {
            const isSelected = selectedFolderIds.includes(folder.id);
            return (
              <TableRow key={folder.id} data-state={isSelected ? 'selected' : undefined}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(v) => onToggleFolderSelect(folder.id, Boolean(v))}
                    aria-label={`Select folder ${folder.name}`}
                  />
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => (!isTrash ? onOpenFolder(folder) : undefined)}
                    className="flex items-center gap-3 text-left font-medium text-slate-900 hover:text-blue-600"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Folder className="h-4 w-4 fill-blue-600/15" />
                    </div>
                    <span className="truncate max-w-[220px] sm:max-w-[320px]">{folder.name}</span>
                  </button>
                </TableCell>
                <TableCell className="hidden md:table-cell text-slate-500">
                  {folder.ownerName}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-right font-mono text-xs text-slate-500 tabular-nums">
                  {folder.itemCount} items
                </TableCell>
                <TableCell className="hidden lg:table-cell text-slate-500 tabular-nums">
                  {formatDate(folder.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Folder actions for ${folder.name}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!isTrash ? (
                        <>
                          <DropdownMenuItem onClick={() => onOpenFolder(folder)}>
                            <Folder className="h-4 w-4" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onRenameFolder(folder)}>
                            <Pencil className="h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem destructive onClick={() => onDeleteFolder(folder)}>
                            <Trash2 className="h-4 w-4" />
                            Move to Trash
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          {onRestoreFolder ? (
                            <DropdownMenuItem onClick={() => onRestoreFolder(folder)}>
                              <RotateCcw className="h-4 w-4" />
                              Restore
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem destructive onClick={() => onDeleteFolder(folder)}>
                            <Trash2 className="h-4 w-4" />
                            Delete permanently
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}

          {files.map((file) => {
            const isSelected = selectedFileIds.includes(file.id);
            return (
              <TableRow key={file.id} data-state={isSelected ? 'selected' : undefined}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(v) => onToggleFileSelect(file.id, Boolean(v))}
                    aria-label={`Select file ${file.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <FileIconBadge
                      category={file.category}
                      extension={file.extension}
                      className="h-8 w-8"
                    />
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onPreviewFile(file)}
                        className="block truncate max-w-[200px] sm:max-w-[320px] text-left font-medium text-slate-900 hover:text-blue-600"
                      >
                        {file.name}
                      </button>
                      {file.shares.length > 0 || file.publicLinkEnabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-blue-600">
                          <Users className="h-3 w-3" />
                          Shared
                        </span>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-slate-500">
                  {file.ownerName}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-right font-mono text-xs text-slate-500 tabular-nums">
                  {formatBytes(file.sizeBytes)}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-slate-500 tabular-nums">
                  {formatDate(file.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center justify-end gap-1">
                    {!isTrash ? (
                      <button
                        type="button"
                        onClick={() => onToggleFavoriteFile(file)}
                        aria-label="Toggle favorite"
                        className={cn(
                          'inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100',
                          file.isFavorite ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500',
                        )}
                      >
                        <Star className={cn('h-4 w-4', file.isFavorite && 'fill-amber-400')} />
                      </button>
                    ) : null}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`File actions for ${file.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onPreviewFile(file)}>
                          <Eye className="h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownloadFile(file)}>
                          <Download className="h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        {!isTrash ? (
                          <>
                            <DropdownMenuItem onClick={() => onShareFile(file)}>
                              <Share2 className="h-4 w-4" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onRenameFile(file)}>
                              <Pencil className="h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onMoveFile(file)}>
                              <FolderInput className="h-4 w-4" />
                              Move to...
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onCopyFile(file)}>
                              <Copy className="h-4 w-4" />
                              Make a copy
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem destructive onClick={() => onDeleteFile(file)}>
                              <Trash2 className="h-4 w-4" />
                              Move to Trash
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuSeparator />
                            {onRestoreFile ? (
                              <DropdownMenuItem onClick={() => onRestoreFile(file)}>
                                <RotateCcw className="h-4 w-4" />
                                Restore
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem destructive onClick={() => onDeleteFile(file)}>
                              <Trash2 className="h-4 w-4" />
                              Delete permanently
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
