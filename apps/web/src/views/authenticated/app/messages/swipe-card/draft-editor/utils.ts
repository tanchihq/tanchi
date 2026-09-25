import { z } from 'zod';
import { type QueueItemDto } from '@/api/queue/entities/response.entities';

export const SUBJECT_MAX_LENGTH = 300;
export const BODY_MAX_LENGTH = 20000;

export const draftSchema = z.object({
  subject: z.string().max(SUBJECT_MAX_LENGTH, 'Subject is too long.'),
  message: z
    .string()
    .trim()
    .min(1, 'The message cannot be empty.')
    .max(BODY_MAX_LENGTH, 'The message is too long.'),
});

export type DraftFormValues = z.infer<typeof draftSchema>;

export const toDraftValues = (item: QueueItemDto): DraftFormValues => ({
  subject: item.subject ?? '',
  message: item.message,
});
