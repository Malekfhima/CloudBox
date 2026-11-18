import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '@/src/api/auth.api';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { getErrorMessage } from '@/src/lib/utils';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/src/lib/validators';
import { AuthShell } from './AuthShell';

export function ForgotPasswordPage() {
  const [sentResult, setSentResult] = useState<{ message: string; tokenHint?: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      const res = await authApi.forgotPassword(values);
      setSentResult({ message: res.message, tokenHint: res.resetTokenHint });
      toast.success('Reset instructions prepared.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your account email to receive a password reset token."
      footer={
        <Link to="/login" className="font-semibold text-blue-600 hover:underline">
          Return to sign in
        </Link>
      }
    >
      {sentResult ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-700">{sentResult.message}</p>
          {sentResult.tokenHint ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-left text-xs text-blue-900">
              <p className="font-medium">Reset token issued:</p>
              <p className="mt-1 break-all font-mono">{sentResult.tokenHint}</p>
            </div>
          ) : null}
          <Button asChild className="w-full">
            <Link
              to={
                sentResult.tokenHint
                  ? `/reset-password?token=${encodeURIComponent(sentResult.tokenHint)}`
                  : '/reset-password'
              }
            >
              Continue to Reset Password
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fp-email">Account email</Label>
            <Input
              id="fp-email"
              type="email"
              placeholder="name@company.com"
              {...register('email')}
            />
            {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Sending...' : 'Send reset instructions'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
