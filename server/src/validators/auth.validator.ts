import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password cannot exceed 100 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name cannot exceed 60 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Invalid or missing reset token'),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10, 'Invalid or missing verification token'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const changeEmailSchema = z.object({
  newEmail: z.string().trim().email('Invalid email address').toLowerCase(),
  currentPassword: z.string().min(1, 'Current password is required for security'),
});

export const editProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60).optional(),
  avatar: z.string().url('Avatar must be a valid URL or base64 data').or(z.literal('')).optional(),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(10, 'Missing Google ID Token'),
});

export const revokeSessionSchema = z.object({
  sessionId: z.string().min(1, 'Missing session ID'),
});

export const deleteAccountSchema = z.object({
  password: z.string().optional(),
  confirmText: z.literal('DELETE', {
    errorMap: () => ({ message: 'Please type DELETE to confirm account removal' }),
  }),
});

