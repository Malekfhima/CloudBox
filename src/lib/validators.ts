import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name is required.'),
    email: z.string().email('Enter a valid work email.'),
    company: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const verifyEmailSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  code: z.string().min(6, 'Enter the 6-digit verification code.'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter your account email address.'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(4, 'Reset token is required.'),
    password: z.string().min(8, 'New password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const contactSchema = z.object({
  name: z.string().min(2, 'Please enter your full name.'),
  email: z.string().email('Enter a valid email address.'),
  company: z.string().optional(),
  subject: z.string().min(3, 'Please enter a subject.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
});

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  title: z.string().max(80).optional(),
  company: z.string().max(80).optional(),
  timezone: z.string().min(2),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'Passwords do not match.',
    path: ['confirmNewPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type ContactFormValues = z.infer<typeof contactSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
