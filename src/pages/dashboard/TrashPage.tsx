import { FileExplorer } from '@/src/components/files/FileExplorer';

export function TrashPage() {
  return (
    <FileExplorer
      scope="trash"
      title="Trash"
      description="Restore accidentally removed items or permanently delete files to reclaim storage quota."
      allowEmptyTrash
    />
  );
}
