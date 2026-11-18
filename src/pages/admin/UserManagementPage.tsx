import { useState, type FormEvent } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { ConfirmationDialog } from '@/src/components/common/ConfirmationDialog';
import { ErrorState } from '@/src/components/common/ErrorState';
import { TableSkeleton } from '@/src/components/common/SkeletonLoaders';
import { SearchBar } from '@/src/components/files/SearchBar';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { useAdminMutations, useAdminUsers } from '@/src/hooks/useAdmin';
import { formatBytes, formatRelativeTime, getErrorMessage } from '@/src/lib/utils';
import type { PlanTier, User } from '@/src/types';

export function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [newPlan, setNewPlan] = useState<PlanTier>('Pro');

  const { data: users = [], isLoading, isError, error, refetch } = useAdminUsers({
    search: search || undefined,
    role: roleFilter,
  });
  const { createUser, updateUser, deleteUser } = useAdminMutations();

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await createUser.mutateAsync({
      name: newName,
      email: newEmail,
      company: newCompany,
      role: newRole,
      plan: newPlan,
    });
    setNewName('');
    setNewEmail('');
    setNewCompany('');
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Provision accounts, adjust subscription plans, and enforce active or suspended states.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Provision user
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search users by name, email, or company..."
          className="w-full sm:max-w-sm"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="user">Members</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Storage</TableHead>
                <TableHead className="hidden lg:table-cell">Last Active</TableHead>
                <TableHead className="w-16 text-right">Remove</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((usr) => (
                <TableRow key={usr.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">{usr.name}</p>
                      <p className="text-xs text-slate-500">
                        {usr.email} · {usr.company}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={usr.role}
                      onValueChange={(val) =>
                        updateUser.mutate({ id: usr.id, payload: { role: val as 'user' | 'admin' } })
                      }
                    >
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={usr.plan}
                      onValueChange={(val) =>
                        updateUser.mutate({ id: usr.id, payload: { plan: val as PlanTier } })
                      }
                    >
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Starter">Starter</SelectItem>
                        <SelectItem value="Pro">Pro</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={usr.status}
                      onValueChange={(val) =>
                        updateUser.mutate({
                          id: usr.id,
                          payload: { status: val as 'active' | 'suspended' },
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-700 tabular-nums">
                    {formatBytes(usr.storageUsedBytes)} / {formatBytes(usr.storageQuotaBytes, 0)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-slate-500 tabular-nums">
                    {formatRelativeTime(usr.lastActiveAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${usr.name}`}
                      onClick={() => setDeleteTarget(usr)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Provision User Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Provision new user</DialogTitle>
            <DialogDescription>
              Create a verified CloudBox member or administrator account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="adm-name">Full name</Label>
              <Input
                id="adm-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adm-email">Work email</Label>
              <Input
                id="adm-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adm-company">Organization</Label>
              <Input
                id="adm-company"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as 'user' | 'admin')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Plan</Label>
                <Select value={newPlan} onValueChange={(v) => setNewPlan(v as PlanTier)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Pro">Pro</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? 'Creating...' : 'Create account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => (!open ? setDeleteTarget(null) : undefined)}
        title={`Remove "${deleteTarget?.name}"?`}
        description="This immediately revokes workspace access for this user."
        confirmLabel="Remove user"
        destructive
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteUser.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
