import { z } from 'zod';

export const REASON_MAX_LENGTH = 500;

export const excludeSchema = z.object({
  scope: z.enum(['person', 'company']),
  reason: z.string().max(REASON_MAX_LENGTH, `Keep it under ${REASON_MAX_LENGTH} characters.`),
});

export type ExcludeFormValues = z.infer<typeof excludeSchema>;

export const DEFAULT_EXCLUDE_VALUES: ExcludeFormValues = {
  scope: 'person',
  reason: '',
};
