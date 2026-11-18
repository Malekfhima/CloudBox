import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '@/src/api/auth.api';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { getErrorMessage } from '@/src/lib/utils';
import { registerSchema, type RegisterFormValues } from '@/src/lib/validators';
import { AuthShell } from './AuthShell';

export function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const res = await authApi.register({
        name: values.name,
        email: values.email,
        password: values.password,
        company: values.company,
      });
      toast.success('Account created. Please verify your email.');
      navigate('/verify-email', {
        state: {
          email: values.email,
          codeHint: res.verificationCodeHint,
        },
      });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed.'));
    }
  };

  return (
    <AuthShell
      title="Create your CloudBox account"
      subtitle="Start with 15 GB of encrypted cloud storage at no cost."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="reg-name">Full name</Label>
          <Input id="reg-name" placeholder="Elena Vance" {...register('name')} />
          {errors.name ? <p className="text-xs text-red-600">{errors.name.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-email">Work email</Label>
          <Input id="reg-email" type="email" placeholder="name@company.com" {...register('email')} />
          {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-company">Organization (optional)</Label>
          <Input id="reg-company" placeholder="Northwind Studio" {...register('company')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-password">Password</Label>
          <Input
            id="reg-password"
            type="password"
            placeholder="Minimum 8 characters"
            {...register('password')}
          />
          {errors.password ? (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-confirm">Confirm password</Label>
          <Input
            id="reg-confirm"
            type="password"
            placeholder="Repeat password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword ? (
            <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
          ) : null}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating workspace...' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}
