import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '@/src/api/auth.api';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { getErrorMessage } from '@/src/lib/utils';
import { loginSchema, type LoginFormValues } from '@/src/lib/validators';
import { useAuthStore } from '@/src/store/authStore';
import { AuthShell } from './AuthShell';

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signInWith = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const res = await authApi.login(values);
      setSession({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: res.user,
      });
      toast.success(`Welcome back, ${res.user.name}.`);
      navigate(res.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const msg = getErrorMessage(err, 'Invalid credentials.');
      setServerError(msg);
      toast.error(msg);
    }
  };

  const quickLogin = async (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
    await signInWith({ email, password });
  };

  return (
    <AuthShell
      title="Sign in to CloudBox"
      subtitle="Access your workspace files, shared links, and storage analytics."
      footer={
        <>
          New to CloudBox?{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(signInWith)} className="space-y-4">
        {serverError ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
          >
            {serverError}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email address</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="name@company.com"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password ? (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          ) : null}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="mb-3 text-center text-xs font-medium text-slate-500">
          Instant workspace evaluation accounts
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={() => quickLogin('elena@cloudbox.io', 'CloudBox2026!')}
          >
            User Demo (Elena)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={() => quickLogin('admin@cloudbox.io', 'AdminBox2026!')}
          >
            Admin Demo (Marcus)
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
