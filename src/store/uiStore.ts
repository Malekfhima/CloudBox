import { create } from 'zustand';

export interface UploadTask {
  id: string;
  fileName: string;
  sizeBytes: number;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

interface UiState {
  viewMode: 'grid' | 'list';
  mobileSidebarOpen: boolean;
  uploadModalOpen: boolean;
  uploadTargetFolderId: string | null;
  uploads: UploadTask[];
  setViewMode: (mode: 'grid' | 'list') => void;
  setMobileSidebarOpen: (open: boolean) => void;
  openUploadModal: (folderId?: string | null) => void;
  closeUploadModal: () => void;
  addUploadTask: (task: UploadTask) => void;
  updateUploadTask: (id: string, patch: Partial<UploadTask>) => void;
  clearCompletedUploads: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  viewMode: 'grid',
  mobileSidebarOpen: false,
  uploadModalOpen: false,
  uploadTargetFolderId: null,
  uploads: [],
  setViewMode: (viewMode) => set({ viewMode }),
  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
  openUploadModal: (folderId = null) =>
    set({ uploadModalOpen: true, uploadTargetFolderId: folderId }),
  closeUploadModal: () => set({ uploadModalOpen: false }),
  addUploadTask: (task) =>
    set((state) => ({ uploads: [task, ...state.uploads.slice(0, 14)] })),
  updateUploadTask: (id, patch) =>
    set((state) => ({
      uploads: state.uploads.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    })),
  clearCompletedUploads: () =>
    set((state) => ({
      uploads: state.uploads.filter((u) => u.status === 'uploading'),
    })),
}));
