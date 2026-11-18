import { useEffect, useState, type FormEvent } from 'react';
import { Server } from 'lucide-react';
import { ErrorState } from '@/src/components/common/ErrorState';
import { DashboardSkeleton } from '@/src/components/common/SkeletonLoaders';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Progress } from '@/src/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { useAdminMutations, useAdminStorage } from '@/src/hooks/useAdmin';
import { formatBytes, getErrorMessage } from '@/src/lib/utils';

export function StorageManagementPage() {
  const { data, isLoading, isError, error, refetch } = useAdminStorage();
  const { updateStorageSettings } = useAdminMutations();
  const [defaultQuota, setDefaultQuota] = useState('15');
  const [maxUpload, setMaxUpload] = useState('500');

  useEffect(() => {
    if (data) {
      setDefaultQuota(String(data.defaultUserQuotaGb));
      setMaxUpload(String(data.maxUploadSizeMb));
    }
  }, [data]);

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) {
    return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;
  }

  const handlePolicySave = async (e: FormEvent) => {
    e.preventDefault();
    await updateStorageSettings.mutateAsync({
      defaultUserQuotaGb: Number(defaultQuota),
      maxUploadSizeMb: Number(maxUpload),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Storage Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor regional object storage clusters, configure workspace quota defaults, and review
          top consumers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {data.nodes.map((node) => {
          const pct = Math.round((node.usedBytes / node.capacityBytes) * 100);
          return (
            <Card key={node.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Server className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{node.label}</p>
                      <p className="text-xs text-slate-500">{node.region}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium capitalize ${
                      node.status === 'healthy' ? 'text-emerald-700' : 'text-amber-600'
                    }`}
                  >
                    {node.status}
                  </span>
                </div>

                <Progress value={pct} />

                <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
                  <span>
                    {formatBytes(node.usedBytes, 0)} / {formatBytes(node.capacityBytes, 0)}
                  </span>
                  <span className="font-mono">{node.latencyMs} ms</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Tenant Quota Policy</CardTitle>
            <CardDescription>Default limits applied to newly registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePolicySave} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pol-quota">Default Starter Quota (GB)</Label>
                <Input
                  id="pol-quota"
                  type="number"
                  min={1}
                  value={defaultQuota}
                  onChange={(e) => setDefaultQuota(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pol-max">Max Upload Size (MB)</Label>
                <Input
                  id="pol-max"
                  type="number"
                  min={10}
                  value={maxUpload}
                  onChange={(e) => setMaxUpload(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={updateStorageSettings.isPending}>
                {updateStorageSettings.isPending ? 'Saving...' : 'Update policy'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Storage Consumers</CardTitle>
            <CardDescription>Accounts ranked by total allocated storage usage</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead className="text-right">Quota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topConsumers.map((usr) => (
                  <TableRow key={usr.id}>
                    <TableCell>
                      <p className="font-medium text-slate-900">{usr.name}</p>
                      <p className="text-xs text-slate-500">{usr.email}</p>
                    </TableCell>
                    <TableCell className="text-slate-600">{usr.plan}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-900 tabular-nums">
                      {formatBytes(usr.storageUsedBytes)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-500 tabular-nums">
                      {formatBytes(usr.storageQuotaBytes, 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
