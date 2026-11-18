import { FileExplorer } from '@/src/components/files/FileExplorer';

export function SharedWithMePage() {
  return (
    <FileExplorer
      scope="shared-with-me"
      title="Shared With Me"
      description="Files shared with you by external collaborators and team members."
    />
  );
}
