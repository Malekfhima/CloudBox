import { FileExplorer } from '@/src/components/files/FileExplorer';

export function FavoritesPage() {
  return (
    <FileExplorer
      scope="favorites"
      title="Favorites"
      description="Starred files and folders pinned for immediate access."
    />
  );
}
