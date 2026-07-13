import { z } from 'zod';

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .refine((value) => value.split(/\s+/).filter(Boolean).length >= 2, {
      error: 'Enter your first and last name.',
    }),
  company: z.string().trim().min(1, 'Company name is required.'),
  email: z.email('Invalid email.'),
  password: z
    .string()
    .min(12, 'At least 12 characters.')
    .regex(/[A-Z]/, 'Add an uppercase letter.')
    .regex(/[0-9]/, 'Add a number.'),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const splitFullName = (
  fullName: string,
): Readonly<{ firstName: string; lastName: string }> => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const [firstName, ...rest] = parts;
  return { firstName: firstName ?? '', lastName: rest.join(' ') };
};
