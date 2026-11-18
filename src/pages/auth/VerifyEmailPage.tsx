import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '@/src/api/auth.api';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { getErrorMessage } from '@/src/lib/utils';
import { verifyEmailSchema, type VerifyEmailFormValues } from '@/src/lib/validators';
import { useAuthStore } from '@/src/store/authStore';
import { AuthShell } from './AuthShell';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as { email?: string; codeHint?: string } | null) || {};
  const setSession = useAuthStore((s) => s.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: state.email || '',
      code: state.codeHint || '',
    },
  });

  const onSubmit = async (values: VerifyEmailFormValues) => {
    try {
      const res = await authApi.verifyEmail(values);
      setSession({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: res.user,
      });
      toast.success('Email verified. Welcome to CloudBox!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Verification failed.'));
    }
  };

  return (
    <AuthShell
      title="Verify your email address"
      subtitle="Enter the 6-digit verification code sent to your inbox."
      footer={
        <Link to="/login" className="font-semibold text-blue-600 hover:underline">
          Back to sign in
        </Link>
      }
    >
      {state.codeHint ? (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs text-blue-800">
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <span>
            Verification code for your new account:{' '}
            <strong className="font-mono">{state.codeHint}</strong>
          </span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ver-email">Email address</Label>
          <Input id="ver-email" type="email" placeholder="name@company.com" {...register('email')} />
          {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ver-code">6-digit verification code</Label>
          <Input
            id="ver-code"
            placeholder="123456"
            className="font-mono tracking-widest"
            {...register('code')}
          />
          {errors.code ? <p className="text-xs text-red-600">{errors.code.message}</p> : null}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Verifying...' : 'Verify and open workspace'}
        </Button>
      </form>
    </AuthShell>
  );
}
