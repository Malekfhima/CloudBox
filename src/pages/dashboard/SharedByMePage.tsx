import { FileExplorer } from '@/src/components/files/FileExplorer';

export function SharedByMePage() {
  return (
    <FileExplorer
      scope="shared-by-me"
      title="Shared By Me"
      description="Files where you have granted collaborator permissions or enabled a public share link."
    />
  );
}
