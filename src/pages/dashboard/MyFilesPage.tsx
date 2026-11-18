import { FileExplorer } from '@/src/components/files/FileExplorer';

export function MyFilesPage() {
  return (
    <FileExplorer
      scope="my-files"
      title="My Files"
      description="Browse folders, upload new documents, and organize your workspace library."
      allowCreateFolder
      allowUpload
    />
  );
}
