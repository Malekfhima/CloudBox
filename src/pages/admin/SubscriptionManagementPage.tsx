import { ErrorState } from '@/src/components/common/ErrorState';
import { TableSkeleton } from '@/src/components/common/SkeletonLoaders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
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
import { useAdminMutations, useAdminSubscriptions } from '@/src/hooks/useAdmin';
import { formatBytes, getErrorMessage } from '@/src/lib/utils';
import type { PlanTier } from '@/src/types';

export function SubscriptionManagementPage() {
  const { data: subscriptions = [], isLoading, isError, error, refetch } = useAdminSubscriptions();
  const { updateSubscription } = useAdminMutations();

  if (isLoading) return <TableSkeleton rows={5} />;
  if (isError) {
    return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;
  }

  const totalMrr = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((acc, s) => acc + s.monthlyPriceUsd, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Subscription Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage organization plans, seat counts, and billing status across CloudBox workspaces.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-right">
          <p className="text-xs text-slate-500">Active Tenant MRR</p>
          <p className="font-mono text-xl font-bold text-slate-950 tabular-nums">
            ${totalMrr.toLocaleString()}/mo
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Subscriptions</CardTitle>
          <CardDescription>Changes update billing amounts and storage quotas immediately</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Quota</TableHead>
                <TableHead className="text-right">Monthly</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Renewal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <p className="font-medium text-slate-900">{sub.organization}</p>
                    <p className="text-xs text-slate-500">
                      {sub.ownerName} · {sub.ownerEmail}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={sub.plan}
                      onValueChange={(val) =>
                        updateSubscription.mutate({
                          id: sub.id,
                          payload: { plan: val as PlanTier },
                        })
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
                    <Input
                      type="number"
                      min={1}
                      max={500}
                      defaultValue={sub.seats}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (val > 0 && val !== sub.seats) {
                          updateSubscription.mutate({ id: sub.id, payload: { seats: val } });
                        }
                      }}
                      className="h-8 w-20 font-mono text-xs tabular-nums"
                      aria-label={`Seat count for ${sub.organization}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={sub.status}
                      onValueChange={(val) =>
                        updateSubscription.mutate({
                          id: sub.id,
                          payload: { status: val as 'active' | 'past_due' | 'canceled' },
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="past_due">Past due</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-600 tabular-nums">
                    {formatBytes(sub.storageQuotaBytes, 0)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold text-slate-900 tabular-nums">
                    ${sub.monthlyPriceUsd.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right text-xs text-slate-500 tabular-nums">
                    {sub.renewalDate}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
