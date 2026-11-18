import { useState, type DragEvent } from 'react';
import {
  FolderInput,
  FolderPlus,
  LayoutGrid,
  List,
  RotateCcw,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { filesApi } from '@/src/api/files.api';
import { ConfirmationDialog } from '@/src/components/common/ConfirmationDialog';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { Pagination } from '@/src/components/common/Pagination';
import { FileGridSkeleton, TableSkeleton } from '@/src/components/common/SkeletonLoaders';
import { Button } from '@/src/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { useFileMutations, useFilesQuery } from '@/src/hooks/useFiles';
import { cn, getErrorMessage } from '@/src/lib/utils';
import { useUiStore } from '@/src/store/uiStore';
import type { FileItem, FileScope, FolderItem } from '@/src/types';
import { Breadcrumbs } from './Breadcrumbs';
import { FileCard } from './FileCard';
import { FilePreviewModal } from './FilePreviewModal';
import { FileTable } from './FileTable';
import { FolderActionModal, type ActionModalState } from './FolderActionModal';
import { FolderCard } from './FolderCard';
import { SearchBar } from './SearchBar';
import { ShareModal } from './ShareModal';

interface FileExplorerProps {
  scope: FileScope;
  title: string;
  description: string;
  allowCreateFolder?: boolean;
  allowUpload?: boolean;
  allowEmptyTrash?: boolean;
}

export function FileExplorer({
  scope,
  title,
  description,
  allowCreateFolder = false,
  allowUpload = false,
  allowEmptyTrash = false,
}: FileExplorerProps) {
  const { viewMode, setViewMode, openUploadModal } = useUiStore();
  const [folderId, setFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'updatedAt'>('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [actionModal, setActionModal] = useState<ActionModalState>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    action: () => Promise<void>;
  } | null>(null);

  const isTrash = scope === 'trash';

  const { data, isLoading, isError, error, refetch } = useFilesQuery({
    scope,
    folderId: scope === 'my-files' ? folderId : null,
    search: search || undefined,
    type: categoryFilter,
    sortBy,
    sortDir,
    page,
    limit: 16,
  });

  const mutations = useFileMutations();

  const folders = data?.folders ?? [];
  const files = data?.items ?? [];
  const breadcrumbs = data?.breadcrumbs ?? [];
  const pagination = data?.pagination;
  const totalSelected = selectedFileIds.length + selectedFolderIds.length;

  const clearSelection = () => {
    setSelectedFileIds([]);
    setSelectedFolderIds([]);
  };

  const handleSortChange = (col: 'name' | 'size' | 'updatedAt') => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir(col === 'name' ? 'asc' : 'desc');
    }
  };

  const handleDropUpload = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (!allowUpload) return;
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) {
      await mutations.uploadFilesWithProgress(dropped, folderId);
    }
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFileIds(files.map((f) => f.id));
      setSelectedFolderIds(folders.map((f) => f.id));
    } else {
      clearSelection();
    }
  };

  const toggleFileSelect = (id: string, checked: boolean) => {
    setSelectedFileIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id),
    );
  };

  const toggleFolderSelect = (id: string, checked: boolean) => {
    setSelectedFolderIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id),
    );
  };

  const handleBulk = async (
    action: 'delete' | 'permanent-delete' | 'restore' | 'favorite' | 'unfavorite',
  ) => {
    await mutations.bulkAction.mutateAsync({
      ids: selectedFileIds,
      folderIds: selectedFolderIds,
      action,
    });
    clearSelection();
  };

  const handleDeleteFilePrompt = (file: FileItem) => {
    if (!isTrash) {
      mutations.deleteFile.mutate({ id: file.id, permanent: false });
      return;
    }
    setConfirmState({
      title: `Permanently delete "${file.name}"?`,
      description: 'This action cannot be undone and the file will be removed from CloudBox.',
      confirmLabel: 'Delete permanently',
      action: async () => {
        await mutations.deleteFile.mutateAsync({ id: file.id, permanent: true });
      },
    });
  };

  const handleDeleteFolderPrompt = (folder: FolderItem) => {
    if (!isTrash) {
      mutations.deleteFolder.mutate({ id: folder.id, permanent: false });
      return;
    }
    setConfirmState({
      title: `Permanently delete "${folder.name}"?`,
      description: 'This folder and all nested files will be erased permanently.',
      confirmLabel: 'Delete permanently',
      action: async () => {
        await mutations.deleteFolder.mutateAsync({ id: folder.id, permanent: true });
      },
    });
  };

  return (
    <div
      onDragOver={(e) => {
        if (allowUpload) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDropUpload}
      className={cn(
        'relative space-y-5 rounded-xl transition-colors',
        dragOver && 'ring-2 ring-blue-600 ring-offset-4 bg-blue-50/20',
      )}
    >
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {allowCreateFolder ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setActionModal({ type: 'create-folder', parentId: folderId })}
            >
              <FolderPlus className="h-4 w-4" />
              New folder
            </Button>
          ) : null}
          {allowUpload ? (
            <Button type="button" onClick={() => openUploadModal(folderId)}>
              <Upload className="h-4 w-4" />
              Upload files
            </Button>
          ) : null}
          {allowEmptyTrash && (files.length > 0 || folders.length > 0) ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                setConfirmState({
                  title: 'Empty Trash?',
                  description:
                    'All files and folders currently in Trash will be permanently deleted and storage reclaimed.',
                  confirmLabel: 'Empty Trash',
                  action: async () => {
                    await mutations.emptyTrash.mutateAsync();
                    clearSelection();
                  },
                })
              }
            >
              <Trash2 className="h-4 w-4" />
              Empty Trash
            </Button>
          ) : null}
        </div>
      </div>

      {/* Breadcrumbs + Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
        {scope === 'my-files' && breadcrumbs.length > 0 && !search ? (
          <div className="border-b border-slate-100 pb-2.5">
            <Breadcrumbs
              items={breadcrumbs}
              onNavigate={(nextId) => {
                setFolderId(nextId);
                setPage(1);
                clearSelection();
              }}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            className="w-full lg:max-w-sm"
          />

          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36 h-10">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="archive">Archives</SelectItem>
                <SelectItem value="code">Code</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={`${sortBy}:${sortDir}`}
              onValueChange={(val) => {
                const [col, dir] = val.split(':') as ['name' | 'size' | 'updatedAt', 'asc' | 'desc'];
                setSortBy(col);
                setSortDir(dir);
              }}
            >
              <SelectTrigger className="w-40 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt:desc">Newest first</SelectItem>
                <SelectItem value="updatedAt:asc">Oldest first</SelectItem>
                <SelectItem value="name:asc">Name (A–Z)</SelectItem>
                <SelectItem value="name:desc">Name (Z–A)</SelectItem>
                <SelectItem value="size:desc">Largest first</SelectItem>
              </SelectContent>
            </Select>

            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900',
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900',
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {totalSelected > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-blue-900 tabular-nums">
              {totalSelected} selected
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isTrash ? (
              <>
                {selectedFileIds.length > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setActionModal({ type: 'bulk-move', fileIds: selectedFileIds })}
                  >
                    <FolderInput className="h-3.5 w-3.5" />
                    Move
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulk('favorite')}
                >
                  <Star className="h-3.5 w-3.5" />
                  Favorite
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulk('delete')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Move to Trash
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulk('restore')}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    setConfirmState({
                      title: `Permanently delete ${totalSelected} item(s)?`,
                      description: 'Selected files and folders will be erased permanently.',
                      confirmLabel: 'Delete permanently',
                      action: async () => {
                        await handleBulk('permanent-delete');
                      },
                    })
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete permanently
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Content Area */}
      {isLoading ? (
        viewMode === 'grid' ? (
          <FileGridSkeleton />
        ) : (
          <TableSkeleton />
        )
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : folders.length === 0 && files.length === 0 ? (
        <EmptyState
          title={search ? 'No matching files found' : `No items in ${title}`}
          description={
            search
              ? `No files or folders matched "${search}". Try adjusting your filters.`
              : allowUpload
                ? 'Drag and drop files anywhere here or click Upload files to get started.'
                : 'Items matching this view will appear here automatically.'
          }
          actionLabel={allowUpload && !search ? 'Upload files' : undefined}
          onAction={allowUpload && !search ? () => openUploadModal(folderId) : undefined}
        />
      ) : viewMode === 'list' ? (
        <FileTable
          folders={folders}
          files={files}
          selectedFileIds={selectedFileIds}
          selectedFolderIds={selectedFolderIds}
          sortBy={sortBy}
          sortDir={sortDir}
          isTrash={isTrash}
          onSortChange={handleSortChange}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleFileSelect={toggleFileSelect}
          onToggleFolderSelect={toggleFolderSelect}
          onOpenFolder={(fld) => {
            setFolderId(fld.id);
            setPage(1);
            clearSelection();
          }}
          onRenameFolder={(fld) =>
            setActionModal({ type: 'rename-folder', id: fld.id, currentName: fld.name })
          }
          onDeleteFolder={handleDeleteFolderPrompt}
          onRestoreFolder={(fld) => mutations.restoreFolder.mutate(fld.id)}
          onPreviewFile={setPreviewFile}
          onDownloadFile={(f) => filesApi.downloadFile(f)}
          onShareFile={setShareFile}
          onRenameFile={(f) =>
            setActionModal({ type: 'rename-file', id: f.id, currentName: f.name })
          }
          onMoveFile={(f) =>
            setActionModal({
              type: 'move-file',
              id: f.id,
              currentFolderId: f.folderId,
              name: f.name,
            })
          }
          onCopyFile={(f) =>
            mutations.copyFile.mutate({ id: f.id, targetFolderId: f.folderId })
          }
          onToggleFavoriteFile={(f) =>
            mutations.toggleFavorite.mutate({ id: f.id, isFavorite: !f.isFavorite })
          }
          onDeleteFile={handleDeleteFilePrompt}
          onRestoreFile={(f) => mutations.restoreFile.mutate(f.id)}
        />
      ) : (
        <div className="space-y-6">
          {folders.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Folders ({folders.length})
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {folders.map((fld) => (
                  <FolderCard
                    key={fld.id}
                    folder={fld}
                    selected={selectedFolderIds.includes(fld.id)}
                    isTrash={isTrash}
                    onSelectChange={(chk) => toggleFolderSelect(fld.id, chk)}
                    onOpen={(target) => {
                      setFolderId(target.id);
                      setPage(1);
                      clearSelection();
                    }}
                    onRename={(target) =>
                      setActionModal({
                        type: 'rename-folder',
                        id: target.id,
                        currentName: target.name,
                      })
                    }
                    onToggleFavorite={(target) =>
                      mutations.toggleFolderFavorite.mutate({
                        id: target.id,
                        isFavorite: !target.isFavorite,
                      })
                    }
                    onDelete={handleDeleteFolderPrompt}
                    onRestore={(target) => mutations.restoreFolder.mutate(target.id)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {files.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Files ({pagination?.total ?? files.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {files.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    selected={selectedFileIds.includes(file.id)}
                    isTrash={isTrash}
                    onSelectChange={(chk) => toggleFileSelect(file.id, chk)}
                    onPreview={setPreviewFile}
                    onDownload={(f) => filesApi.downloadFile(f)}
                    onShare={setShareFile}
                    onRename={(f) =>
                      setActionModal({ type: 'rename-file', id: f.id, currentName: f.name })
                    }
                    onMove={(f) =>
                      setActionModal({
                        type: 'move-file',
                        id: f.id,
                        currentFolderId: f.folderId,
                        name: f.name,
                      })
                    }
                    onCopy={(f) =>
                      mutations.copyFile.mutate({ id: f.id, targetFolderId: f.folderId })
                    }
                    onToggleFavorite={(f) =>
                      mutations.toggleFavorite.mutate({ id: f.id, isFavorite: !f.isFavorite })
                    }
                    onDelete={handleDeleteFilePrompt}
                    onRestore={(f) => mutations.restoreFile.mutate(f.id)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 ? (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          limit={pagination.limit}
          onPageChange={setPage}
        />
      ) : null}

      {/* Modals */}
      <FilePreviewModal
        file={previewFile}
        onOpenChange={(open) => (!open ? setPreviewFile(null) : undefined)}
        onDownload={(f) => filesApi.downloadFile(f)}
        onShare={(f) => {
          setPreviewFile(null);
          setShareFile(f);
        }}
        onToggleFavorite={(f) => {
          mutations.toggleFavorite.mutate({ id: f.id, isFavorite: !f.isFavorite });
          setPreviewFile({ ...f, isFavorite: !f.isFavorite });
        }}
      />

      <ShareModal
        file={shareFile}
        onOpenChange={(open) => (!open ? setShareFile(null) : undefined)}
        onUpdated={(updated) => setShareFile(updated)}
      />

      <FolderActionModal
        modal={actionModal}
        onClose={() => setActionModal(null)}
        onCreateFolder={async (name, parentId) => {
          await mutations.createFolder.mutateAsync({ name, parentId });
        }}
        onRenameFile={async (id, name) => {
          await mutations.renameFile.mutateAsync({ id, name });
        }}
        onRenameFolder={async (id, name) => {
          await mutations.renameFolder.mutateAsync({ id, name });
        }}
        onMoveFile={async (id, targetId) => {
          await mutations.moveFile.mutateAsync({ id, folderId: targetId });
        }}
        onBulkMove={async (fileIds, targetId) => {
          await mutations.bulkAction.mutateAsync({
            ids: fileIds,
            action: 'move',
            targetFolderId: targetId,
          });
          clearSelection();
        }}
      />

      <ConfirmationDialog
        open={Boolean(confirmState)}
        onOpenChange={(open) => (!open ? setConfirmState(null) : undefined)}
        title={confirmState?.title ?? ''}
        description={confirmState?.description ?? ''}
        confirmLabel={confirmState?.confirmLabel}
        destructive
        onConfirm={async () => {
          if (confirmState) {
            await confirmState.action();
            setConfirmState(null);
          }
        }}
      />
    </div>
  );
}
