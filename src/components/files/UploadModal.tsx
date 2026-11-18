import { useRef, useState, type DragEvent } from 'react';
import { FileUp, UploadCloud, X } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { useFileMutations } from '@/src/hooks/useFiles';
import { cn, formatBytes } from '@/src/lib/utils';
import { useUiStore } from '@/src/store/uiStore';

export function UploadModal() {
  const { uploadModalOpen, uploadTargetFolderId, closeUploadModal } = useUiStore();
  const { uploadFilesWithProgress } = useFileMutations();
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = Array.from(incoming);
    setQueuedFiles((prev) => [...prev, ...next]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (queuedFiles.length === 0) return;
    setSubmitting(true);
    try {
      await uploadFilesWithProgress(queuedFiles, uploadTargetFolderId);
      setQueuedFiles([]);
      closeUploadModal();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={uploadModalOpen}
      onOpenChange={(open) => {
        if (!open && !submitting) {
          setQueuedFiles([]);
          closeUploadModal();
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload files to CloudBox</DialogTitle>
          <DialogDescription>
            Drag and drop documents, images, videos, or archives below. Maximum 100 MB per file.
          </DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
            dragging
              ? 'border-blue-600 bg-blue-50/70'
              : 'border-slate-200 bg-slate-50/60 hover:border-slate-300',
          )}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-slate-900">
            Drop files here to queue them for upload
          </p>
          <p className="mt-1 text-xs text-slate-500">or browse from your computer</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="mt-4"
          >
            <FileUp className="h-4 w-4" />
            Choose files
          </Button>
        </div>

        {queuedFiles.length > 0 ? (
          <div className="mt-4 max-h-44 space-y-2 overflow-y-auto pr-1">
            {queuedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-500 tabular-nums">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setQueuedFiles((prev) => prev.filter((_, i) => i !== idx))}
                  aria-label={`Remove ${file.name}`}
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setQueuedFiles([]);
              closeUploadModal();
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={queuedFiles.length === 0 || submitting}
          >
            {submitting
              ? 'Uploading...'
              : `Upload ${queuedFiles.length > 0 ? `(${queuedFiles.length})` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
