import { apiClient } from './client';
import type {
  FileItem,
  FileScope,
  FileShareEntry,
  FilesQueryResponse,
  FolderItem,
  SharePermission,
} from '@/src/types';

export interface ListFilesParams {
  scope?: FileScope;
  folderId?: string | null;
  search?: string;
  type?: string;
  sortBy?: 'name' | 'size' | 'updatedAt';
  sortDir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const filesApi = {
  listFiles: async (params: ListFilesParams) => {
    const { data } = await apiClient.get<FilesQueryResponse>('/files', {
      params: {
        ...params,
        folderId: params.folderId ?? undefined,
      },
    });
    return data;
  },

  listAllFolders: async () => {
    const { data } = await apiClient.get<{ folders: FolderItem[] }>('/folders');
    return data.folders;
  },

  createFolder: async (payload: { name: string; parentId?: string | null }) => {
    const { data } = await apiClient.post<{ folder: FolderItem }>('/folders', payload);
    return data.folder;
  },

  updateFolder: async (
    id: string,
    payload: { name?: string; parentId?: string | null; isFavorite?: boolean },
  ) => {
    const { data } = await apiClient.patch<{ folder: FolderItem }>(`/folders/${id}`, payload);
    return data.folder;
  },

  deleteFolder: async (id: string, permanent = false) => {
    await apiClient.delete(`/folders/${id}`, { params: { permanent } });
  },

  restoreFolder: async (id: string) => {
    const { data } = await apiClient.post<{ folder: FolderItem }>(`/folders/${id}/restore`);
    return data.folder;
  },

  uploadFiles: async (
    files: File[],
    folderId: string | null,
    onProgress?: (percent: number) => void,
  ) => {
    const formData = new FormData();
    formData.append('folderId', folderId ?? 'null');
    for (const file of files) {
      formData.append('files', file);
    }
    const { data } = await apiClient.post<{ files: FileItem[] }>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (evt.total && onProgress) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    });
    return data.files;
  },

  updateFile: async (
    id: string,
    payload: { name?: string; folderId?: string | null; isFavorite?: boolean },
  ) => {
    const { data } = await apiClient.patch<{ file: FileItem }>(`/files/${id}`, payload);
    return data.file;
  },

  copyFile: async (id: string, targetFolderId?: string | null) => {
    const { data } = await apiClient.post<{ file: FileItem }>(`/files/${id}/copy`, {
      targetFolderId,
    });
    return data.file;
  },

  deleteFile: async (id: string, permanent = false) => {
    await apiClient.delete(`/files/${id}`, { params: { permanent } });
  },

  restoreFile: async (id: string) => {
    const { data } = await apiClient.post<{ file: FileItem }>(`/files/${id}/restore`);
    return data.file;
  },

  bulkAction: async (payload: {
    ids: string[];
    folderIds?: string[];
    action: 'delete' | 'permanent-delete' | 'restore' | 'move' | 'favorite' | 'unfavorite';
    targetFolderId?: string | null;
  }) => {
    const { data } = await apiClient.post<{ affected: number }>('/files/bulk', payload);
    return data;
  },

  emptyTrash: async () => {
    const { data } = await apiClient.post<{ success: boolean; reclaimedBytes: number }>(
      '/trash/empty',
    );
    return data;
  },

  downloadFile: async (file: FileItem) => {
    const response = await apiClient.get(`/files/${file.id}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', file.name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getShares: async (fileId: string) => {
    const { data } = await apiClient.get<{
      shares: FileShareEntry[];
      publicLinkEnabled: boolean;
      publicLinkToken: string | null;
      publicLinkPermission: 'viewer' | 'editor';
      publicLinkExpiresAt: string | null;
    }>(`/files/${fileId}/shares`);
    return data;
  },

  updateShares: async (
    fileId: string,
    payload: {
      email?: string;
      permission?: SharePermission;
      publicLinkEnabled?: boolean;
      publicLinkPermission?: 'viewer' | 'editor';
      publicLinkExpiresAt?: string | null;
    },
  ) => {
    const { data } = await apiClient.post<{ file: FileItem }>(`/files/${fileId}/shares`, payload);
    return data.file;
  },

  revokeShare: async (fileId: string, shareId: string) => {
    const { data } = await apiClient.delete<{ file: FileItem }>(
      `/files/${fileId}/shares/${shareId}`,
    );
    return data.file;
  },
};
