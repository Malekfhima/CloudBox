import { useState } from 'react';
import { Download, Share2, Star } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { FileIconBadge } from './FileIconBadge';
import { cn, formatBytes, formatDate } from '@/src/lib/utils';
import type { FileItem } from '@/src/types';

interface FilePreviewModalProps {
  file: FileItem | null;
  onOpenChange: (open: boolean) => void;
  onDownload: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onToggleFavorite: (file: FileItem) => void;
}

export function FilePreviewModal({
  file,
  onOpenChange,
  onDownload,
  onShare,
  onToggleFavorite,
}: FilePreviewModalProps) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!file) return null;

  const isImage = file.category === 'image' && file.previewUrl && !imgFailed;

  return (
    <Dialog
      open={Boolean(file)}
      onOpenChange={(open) => {
        if (!open) setImgFailed(false);
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <FileIconBadge category={file.category} extension={file.extension} />
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate">{file.name}</DialogTitle>
              <DialogDescription className="mt-1 flex flex-wrap items-center gap-2 text-xs tabular-nums">
                <span>{formatBytes(file.sizeBytes)}</span>
                <span aria-hidden="true">·</span>
                <span>Version {file.version}</span>
                <span aria-hidden="true">·</span>
                <span>Modified {formatDate(file.updatedAt)}</span>
                <span aria-hidden="true">·</span>
                <span>Owner: {file.ownerName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {isImage ? (
            <div className="flex max-h-[420px] items-center justify-center bg-slate-900/5 p-4">
              <img
                src={file.previewUrl!}
                alt={file.name}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="max-h-[380px] w-auto rounded-lg object-contain shadow-sm"
              />
            </div>
          ) : file.textSnippet ? (
            <div className="max-h-[380px] overflow-auto bg-white p-5">
              <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-800">
                {file.textSnippet}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <FileIconBadge
                category={file.category}
                extension={file.extension}
                className="mb-3 h-14 w-14"
              />
              <p className="text-sm font-medium text-slate-900">
                {file.category.toUpperCase()} Preview Ready for Download
              </p>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Binary media and archive files ({file.mimeType}) can be downloaded directly to open
                with your local application.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onToggleFavorite(file)}
            >
              <Star
                className={cn(
                  'h-4 w-4',
                  file.isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-500',
                )}
              />
              {file.isFavorite ? 'Favorited' : 'Favorite'}
            </Button>
            {!file.isTrashed ? (
              <Button type="button" variant="outline" size="sm" onClick={() => onShare(file)}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            ) : null}
          </div>

          <Button type="button" onClick={() => onDownload(file)}>
            <Download className="h-4 w-4" />
            Download file
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
