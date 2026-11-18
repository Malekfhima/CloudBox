import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Globe, Lock, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { filesApi } from '@/src/api/files.api';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Switch } from '@/src/components/ui/switch';
import { PermissionSelector } from './PermissionSelector';
import { FILES_QUERY_KEY } from '@/src/hooks/useFiles';
import { getErrorMessage } from '@/src/lib/utils';
import type { FileItem, SharePermission } from '@/src/types';

interface ShareModalProps {
  file: FileItem | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: (updated: FileItem) => void;
}

export function ShareModal({ file, onOpenChange, onUpdated }: ShareModalProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<SharePermission>('viewer');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!file) return null;

  const shareUrl = file.publicLinkToken
    ? `${window.location.origin}/share/${file.publicLinkToken}`
    : `${window.location.origin}/share/${file.id}`;

  const refreshCache = (updated: FileItem) => {
    onUpdated(updated);
    queryClient.invalidateQueries({ queryKey: FILES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const updated = await filesApi.updateShares(file.id, {
        email: email.trim(),
        permission,
      });
      toast.success(`Shared with ${email.trim()}.`);
      setEmail('');
      refreshCache(updated);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to share file.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleUpdate = async (collabEmail: string, nextPerm: SharePermission) => {
    try {
      const updated = await filesApi.updateShares(file.id, {
        email: collabEmail,
        permission: nextPerm,
      });
      toast.success('Updated collaborator permission.');
      refreshCache(updated);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleRevoke = async (shareId: string) => {
    try {
      const updated = await filesApi.revokeShare(file.id, shareId);
      toast.success('Collaborator access removed.');
      refreshCache(updated);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleToggleLink = async (enabled: boolean) => {
    try {
      const updated = await filesApi.updateShares(file.id, {
        publicLinkEnabled: enabled,
      });
      toast.success(enabled ? 'Public link enabled.' : 'Public link disabled.');
      refreshCache(updated);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleLinkPermission = async (perm: SharePermission) => {
    try {
      const updated = await filesApi.updateShares(file.id, {
        publicLinkPermission: perm === 'editor' ? 'editor' : 'viewer',
      });
      toast.success('Link access updated.');
      refreshCache(updated);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Share link copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Unable to copy link.');
    }
  };

  return (
    <Dialog open={Boolean(file)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="truncate">Share &ldquo;{file.name}&rdquo;</DialogTitle>
          <DialogDescription>
            Invite collaborators by email or manage external link access permissions.
          </DialogDescription>
        </DialogHeader>

        {/* Invite Form */}
        <form onSubmit={handleInvite} className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <PermissionSelector value={permission} onChange={setPermission} className="w-28" />
            <Button type="submit" disabled={submitting}>
              <UserPlus className="h-4 w-4" />
              Invite
            </Button>
          </div>
        </form>

        {/* People with access */}
        <div className="mt-5">
          <p className="mb-2.5 text-xs font-semibold text-slate-500">People with access</p>
          <div className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/40 px-3">
            <div className="flex items-center justify-between py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{file.ownerName}</p>
                <p className="truncate text-xs text-slate-500">{file.ownerEmail}</p>
              </div>
              <span className="text-xs font-medium text-slate-500">Owner</span>
            </div>

            {file.shares.map((share) => (
              <div key={share.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{share.name}</p>
                  <p className="truncate text-xs text-slate-500">{share.email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <PermissionSelector
                    value={share.permission}
                    onChange={(p) => handleRoleUpdate(share.email, p)}
                    className="h-8 w-28 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleRevoke(share.id)}
                    aria-label={`Remove ${share.email}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Public Link Access */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700">
                {file.publicLinkEnabled ? (
                  <Globe className="h-4 w-4 text-blue-600" />
                ) : (
                  <Lock className="h-4 w-4 text-slate-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Public share link</p>
                <p className="text-xs text-slate-500">
                  {file.publicLinkEnabled
                    ? 'Anyone with this link can access the file'
                    : 'Only invited collaborators can open this file'}
                </p>
              </div>
            </div>
            <Switch
              checked={file.publicLinkEnabled}
              onCheckedChange={handleToggleLink}
              aria-label="Toggle public share link"
            />
          </div>

          {file.publicLinkEnabled ? (
            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
              <Input readOnly value={shareUrl} className="h-9 bg-white font-mono text-xs" />
              <div className="flex items-center gap-2 shrink-0">
                <PermissionSelector
                  value={file.publicLinkPermission}
                  onChange={handleLinkPermission}
                  className="h-9 w-28 text-xs"
                />
                <Button type="button" variant="outline" size="sm" onClick={copyLink}>
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
