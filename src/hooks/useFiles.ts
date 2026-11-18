import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { filesApi, type ListFilesParams } from '@/src/api/files.api';
import { getErrorMessage } from '@/src/lib/utils';
import { useUiStore } from '@/src/store/uiStore';
import type { FilesQueryResponse } from '@/src/types';

export const FILES_QUERY_KEY = ['files'] as const;

export function useFilesQuery(params: ListFilesParams) {
  return useQuery({
    queryKey: [...FILES_QUERY_KEY, params],
    queryFn: () => filesApi.listFiles(params),
  });
}

export function useAllFoldersQuery() {
  return useQuery({
    queryKey: ['folders', 'all'],
    queryFn: filesApi.listAllFolders,
  });
}

export function useFileMutations() {
  const queryClient = useQueryClient();
  const { addUploadTask, updateUploadTask } = useUiStore();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: FILES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['folders'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['storage'] });
  };

  const createFolder = useMutation({
    mutationFn: filesApi.createFolder,
    onSuccess: (folder) => {
      toast.success(`Folder "${folder.name}" created.`);
      invalidateAll();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to create folder.')),
  });

  const renameFolder = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      filesApi.updateFolder(id, { name }),
    onSuccess: (folder) => {
      toast.success(`Renamed folder to "${folder.name}".`);
      invalidateAll();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to rename folder.')),
  });

  const toggleFolderFavorite = useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      filesApi.updateFolder(id, { isFavorite }),
    onSuccess: () => invalidateAll(),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteFolder = useMutation({
    mutationFn: ({ id, permanent = false }: { id: string; permanent?: boolean }) =>
      filesApi.deleteFolder(id, permanent),
    onSuccess: (_, vars) => {
      toast.success(vars.permanent ? 'Folder permanently deleted.' : 'Folder moved to Trash.');
      invalidateAll();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const restoreFolder = useMutation({
    mutationFn: (id: string) => filesApi.restoreFolder(id),
    onSuccess: (folder) => {
      toast.success(`Restored "${folder.name}".`);
      invalidateAll();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const toggleFavorite = useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      filesApi.updateFile(id, { isFavorite }),
    onMutate: async ({ id, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: FILES_QUERY_KEY });
      const previous = queryClient.getQueriesData<FilesQueryResponse>({
        queryKey: FILES_QUERY_KEY,
      });
      queryClient.setQueriesData<FilesQueryResponse>(
        { queryKey: FILES_QUERY_KEY },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((item) =>
                  item.id === id ? { ...item, isFavorite } : item,
                ),
              }
            : old,
      );
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) {
        for (const [key, data] of ctx.previous) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(getErrorMessage(err, 'Could not update favorite status.'));
    },
    onSettled: () => invalidateAll(),
  });

  const renameFile = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      filesApi.updateFile(id, { name }),
    onSuccess: (file) => {
      toast.success(`Renamed to "${file.name}".`);
      invalidateAll();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to rename file.')),
  });

  const moveFile = useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
      filesApi.updateFile(id, { folderId }),
    onSuccess: () => {
      toast.success('File moved.');
      invalidateAll();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to move file.')),
  });

  const copyFile = useMutation({
    mutationFn: ({ id, targetFolderId }: { id: string; targetFolderId?: string | null }) =>
      filesApi.copyFile(id, targetFolderId),
    onSuccess: (file) => {
      toast.success(`Copied as "${file.name}".`);
      invalidateAll();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to copy file.')),
  });

  const deleteFile = useMutation({
    mutationFn: ({ id, permanent = false }: { id: string; permanent?: boolean }) =>
      filesApi.deleteFile(id, permanent),
    onSuccess: (_, vars) => {
      toast.success(vars.permanent ? 'File permanently deleted.' : 'Moved to Trash.');
      invalidateAll();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to delete file.')),
  });

  const restoreFile = useMutation({
    mutationFn: (id: string) => filesApi.restoreFile(id),
    onSuccess: (file) => {
      toast.success(`Restored "${file.name}".`);
      invalidateAll();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const bulkAction = useMutation({
    mutationFn: filesApi.bulkAction,
    onSuccess: (res, vars) => {
      const labelMap: Record<typeof vars.action, string> = {
        delete: 'moved to Trash',
        'permanent-delete': 'permanently deleted',
        restore: 'restored',
        move: 'moved',
        favorite: 'added to Favorites',
        unfavorite: 'removed from Favorites',
      };
      toast.success(`${res.affected} item(s) ${labelMap[vars.action]}.`);
      invalidateAll();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Bulk operation failed.')),
  });

  const emptyTrash = useMutation({
    mutationFn: filesApi.emptyTrash,
    onSuccess: () => {
      toast.success('Trash emptied.');
      invalidateAll();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const uploadFilesWithProgress = async (files: File[], folderId: string | null) => {
    const taskIds = files.map((file) => {
      const id = `upl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      addUploadTask({
        id,
        fileName: file.name,
        sizeBytes: file.size,
        progress: 5,
        status: 'uploading',
      });
      return id;
    });

    try {
      const created = await filesApi.uploadFiles(files, folderId, (pct) => {
        for (const id of taskIds) {
          updateUploadTask(id, { progress: pct });
        }
      });
      for (const id of taskIds) {
        updateUploadTask(id, { progress: 100, status: 'completed' });
      }
      toast.success(`${created.length} file(s) uploaded.`);
      invalidateAll();
      return created;
    } catch (err) {
      const msg = getErrorMessage(err, 'Upload failed.');
      for (const id of taskIds) {
        updateUploadTask(id, { status: 'error', errorMessage: msg });
      }
      toast.error(msg);
      throw err;
    }
  };

  return {
    createFolder,
    renameFolder,
    toggleFolderFavorite,
    deleteFolder,
    restoreFolder,
    toggleFavorite,
    renameFile,
    moveFile,
    copyFile,
    deleteFile,
    restoreFile,
    bulkAction,
    emptyTrash,
    uploadFilesWithProgress,
  };
}
