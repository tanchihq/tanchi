import { z } from 'zod';

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(12, 'At least 12 characters.')
      .regex(/[A-Z]/, 'Add an uppercase letter.')
      .regex(/[0-9]/, 'Add a number.'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    error: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
