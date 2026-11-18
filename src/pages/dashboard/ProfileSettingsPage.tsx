import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { useSettingsMutations } from '@/src/hooks/useDashboard';
import { formatDate } from '@/src/lib/utils';
import { profileSchema, type ProfileFormValues } from '@/src/lib/validators';
import { useAuthStore } from '@/src/store/authStore';

export function ProfileSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { updateProfile } = useSettingsMutations();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      title: user?.title || '',
      company: user?.company || '',
      timezone: user?.timezone || 'UTC',
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    await updateProfile.mutateAsync(values);
  };

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Profile Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your public identity, organization details, and regional display preferences.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="h-16 w-16 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
              {initials}
            </div>
          )}
          <div>
            <CardTitle>{user.name}</CardTitle>
            <CardDescription>
              {user.email} · {user.plan} Plan · Member since {formatDate(user.createdAt)}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="prof-name">Full name</Label>
                <Input id="prof-name" {...register('name')} />
                {errors.name ? <p className="text-xs text-red-600">{errors.name.message}</p> : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prof-email">Email address</Label>
                <Input id="prof-email" value={user.email} disabled />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="prof-title">Job title</Label>
                <Input id="prof-title" placeholder="Product Architect" {...register('title')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prof-company">Organization</Label>
                <Input id="prof-company" placeholder="Northwind Studio" {...register('company')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prof-tz">Timezone</Label>
              <Input id="prof-tz" placeholder="America/Los_Angeles" {...register('timezone')} />
              {errors.timezone ? (
                <p className="text-xs text-red-600">{errors.timezone.message}</p>
              ) : null}
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isSubmitting || updateProfile.isPending}>
                {isSubmitting || updateProfile.isPending ? 'Saving...' : 'Save profile changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
