import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Folder, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { eventsService } from '@/services/events';
import { getErrorMessage } from '@/services/api';

export function FolderSection({ eventId }: { eventId: string }) {
  const queryClient = useQueryClient();
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: folders, isLoading } = useQuery({
    queryKey: ['folders', eventId],
    queryFn: () => eventsService.listFolders(eventId),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => eventsService.createFolder(eventId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', eventId] });
      setNewFolderName('');
      setError(null);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (folderId: string) => eventsService.deleteFolder(eventId, folderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folders', eventId] }),
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    createMutation.mutate(newFolderName.trim());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Folders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            placeholder="New folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={createMutation.isPending}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {isLoading && <Skeleton className="h-20 w-full" />}

        {!isLoading && folders?.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No folders yet. Create folders to organize photos.
          </p>
        )}

        {folders && folders.length > 0 && (
          <ul className="divide-y rounded-md border">
            {folders.map((folder) => (
              <li key={folder.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">{folder.photoCount} photos</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteMutation.mutate(folder.id)}
                  disabled={deleteMutation.isPending || (folder.photoCount ?? 0) > 0}
                  aria-label={`Delete folder ${folder.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
