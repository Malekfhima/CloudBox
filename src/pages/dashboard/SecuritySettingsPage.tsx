import { zodResolver } from '@hookform/resolvers/zod';
import { Monitor, ShieldCheck, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Switch } from '@/src/components/ui/switch';
import { useSessions, useSettingsMutations } from '@/src/hooks/useDashboard';
import { formatRelativeTime } from '@/src/lib/utils';
import { changePasswordSchema, type ChangePasswordFormValues } from '@/src/lib/validators';
import { useAuthStore } from '@/src/store/authStore';

export function SecuritySettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { data: sessions = [] } = useSessions();
  const { changePassword, updateSecurity, revokeSession } = useSettingsMutations();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  if (!user) return null;

  const onPasswordSubmit = async (values: ChangePasswordFormValues) => {
    await changePassword.mutateAsync({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    reset();
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Security Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Protect your workspace with password rotation, two-factor authentication, and session
          controls.
        </p>
      </div>

      {/* Authentication Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication &amp; Alerts</CardTitle>
          <CardDescription>Configure second-factor verification and session timeout</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="text-sm font-medium text-slate-900">Two-factor authentication (2FA)</p>
              <p className="text-xs text-slate-500">
                Require a rotating authenticator code whenever you sign in on a new device.
              </p>
            </div>
            <Switch
              checked={user.twoFactorEnabled}
              onCheckedChange={(checked) => updateSecurity.mutate({ twoFactorEnabled: checked })}
              aria-label="Toggle two-factor authentication"
            />
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="text-sm font-medium text-slate-900">New sign-in email alerts</p>
              <p className="text-xs text-slate-500">
                Receive an immediate security notice when a session starts from a new IP address.
              </p>
            </div>
            <Switch
              checked={user.loginAlertsEnabled}
              onCheckedChange={(checked) => updateSecurity.mutate({ loginAlertsEnabled: checked })}
              aria-label="Toggle sign-in alerts"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Idle session timeout</p>
              <p className="text-xs text-slate-500">
                Automatically lock inactive web sessions after the chosen interval.
              </p>
            </div>
            <Select
              value={String(user.sessionTimeoutMinutes)}
              onValueChange={(val) =>
                updateSecurity.mutate({ sessionTimeoutMinutes: Number(val) })
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Use a unique password of at least 8 characters</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sec-curr">Current password</Label>
              <Input id="sec-curr" type="password" {...register('currentPassword')} />
              {errors.currentPassword ? (
                <p className="text-xs text-red-600">{errors.currentPassword.message}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sec-new">New password</Label>
                <Input id="sec-new" type="password" {...register('newPassword')} />
                {errors.newPassword ? (
                  <p className="text-xs text-red-600">{errors.newPassword.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sec-confirm">Confirm new password</Label>
                <Input id="sec-confirm" type="password" {...register('confirmNewPassword')} />
                {errors.confirmNewPassword ? (
                  <p className="text-xs text-red-600">{errors.confirmNewPassword.message}</p>
                ) : null}
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting || changePassword.isPending}>
              {isSubmitting || changePassword.isPending ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Devices currently authenticated with your CloudBox account</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          {sessions.map((ses) => (
            <div
              key={ses.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                  <Monitor className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {ses.device}{' '}
                    {ses.current ? (
                      <span className="ml-1.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Current session
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {ses.browser} · {ses.location} · {ses.ipAddress} · Last seen{' '}
                    {formatRelativeTime(ses.lastSeenAt)}
                  </p>
                </div>
              </div>
              {!ses.current ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeSession.mutate(ses.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                  Revoke
                </Button>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
