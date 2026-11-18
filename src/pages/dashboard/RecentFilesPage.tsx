import { FileExplorer } from '@/src/components/files/FileExplorer';

export function RecentFilesPage() {
  return (
    <FileExplorer
      scope="recent"
      title="Recent Files"
      description="Files created or modified recently across your CloudBox directories."
    />
  );
}
