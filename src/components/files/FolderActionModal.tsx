import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { useAllFoldersQuery } from '@/src/hooks/useFiles';

export type ActionModalState =
  | { type: 'create-folder'; parentId: string | null }
  | { type: 'rename-file'; id: string; currentName: string }
  | { type: 'rename-folder'; id: string; currentName: string }
  | { type: 'move-file'; id: string; currentFolderId: string | null; name: string }
  | { type: 'bulk-move'; fileIds: string[] }
  | null;

interface FolderActionModalProps {
  modal: ActionModalState;
  onClose: () => void;
  onCreateFolder: (name: string, parentId: string | null) => Promise<void>;
  onRenameFile: (id: string, name: string) => Promise<void>;
  onRenameFolder: (id: string, name: string) => Promise<void>;
  onMoveFile: (id: string, folderId: string | null) => Promise<void>;
  onBulkMove: (fileIds: string[], targetFolderId: string | null) => Promise<void>;
}

export function FolderActionModal({
  modal,
  onClose,
  onCreateFolder,
  onRenameFile,
  onRenameFolder,
  onMoveFile,
  onBulkMove,
}: FolderActionModalProps) {
  const [nameInput, setNameInput] = useState('');
  const [targetFolder, setTargetFolder] = useState<string>('__root__');
  const [submitting, setSubmitting] = useState(false);

  const { data: folders = [] } = useAllFoldersQuery();

  useEffect(() => {
    if (!modal) return;
    if (modal.type === 'create-folder') setNameInput('');
    if (modal.type === 'rename-file' || modal.type === 'rename-folder') {
      setNameInput(modal.currentName);
    }
    if (modal.type === 'move-file') {
      setTargetFolder(modal.currentFolderId ?? '__root__');
    }
    if (modal.type === 'bulk-move') {
      setTargetFolder('__root__');
    }
  }, [modal]);

  if (!modal) return null;

  const isMove = modal.type === 'move-file' || modal.type === 'bulk-move';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modal.type === 'create-folder') {
        await onCreateFolder(nameInput.trim(), modal.parentId);
      } else if (modal.type === 'rename-file') {
        await onRenameFile(modal.id, nameInput.trim());
      } else if (modal.type === 'rename-folder') {
        await onRenameFolder(modal.id, nameInput.trim());
      } else if (modal.type === 'move-file') {
        await onMoveFile(modal.id, targetFolder === '__root__' ? null : targetFolder);
      } else if (modal.type === 'bulk-move') {
        await onBulkMove(modal.fileIds, targetFolder === '__root__' ? null : targetFolder);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const titles: Record<NonNullable<ActionModalState>['type'], string> = {
    'create-folder': 'New folder',
    'rename-file': 'Rename file',
    'rename-folder': 'Rename folder',
    'move-file': 'Move file',
    'bulk-move': `Move ${modal.type === 'bulk-move' ? modal.fileIds.length : 0} selected file(s)`,
  };

  return (
    <Dialog open={Boolean(modal)} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titles[modal.type]}</DialogTitle>
          <DialogDescription>
            {isMove
              ? 'Select the destination folder inside your CloudBox workspace.'
              : 'Enter a clear name to organize your workspace.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isMove ? (
            <div className="space-y-2">
              <Label htmlFor="folder-or-file-name">Name</Label>
              <Input
                id="folder-or-file-name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={modal.type === 'create-folder' ? 'e.g. Q1 Marketing Assets' : 'Name'}
                required
                autoFocus
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Destination folder</Label>
              <Select value={targetFolder} onValueChange={setTargetFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__root__">My Files (Root)</SelectItem>
                  {folders.map((fld) => (
                    <SelectItem key={fld.id} value={fld.id}>
                      {fld.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || (!isMove && !nameInput.trim())}
            >
              {submitting ? 'Saving...' : isMove ? 'Move here' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
