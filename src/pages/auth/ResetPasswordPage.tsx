import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '@/src/api/auth.api';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { getErrorMessage } from '@/src/lib/utils';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/src/lib/validators';
import { AuthShell } from './AuthShell';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: searchParams.get('token') || '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    try {
      const res = await authApi.resetPassword({
        token: values.token,
        password: values.password,
      });
      toast.success(res.message);
      navigate('/login');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to reset password.'));
    }
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Enter your reset token and choose a strong password."
      footer={
        <Link to="/login" className="font-semibold text-blue-600 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="rp-token">Reset token</Label>
          <Input id="rp-token" className="font-mono text-xs" {...register('token')} />
          {errors.token ? <p className="text-xs text-red-600">{errors.token.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rp-pass">New password</Label>
          <Input id="rp-pass" type="password" placeholder="Minimum 8 characters" {...register('password')} />
          {errors.password ? (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rp-confirm">Confirm new password</Label>
          <Input id="rp-confirm" type="password" placeholder="Repeat password" {...register('confirmPassword')} />
          {errors.confirmPassword ? (
            <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
          ) : null}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Updating password...' : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  );
}
