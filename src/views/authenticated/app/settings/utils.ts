import { z } from 'zod';
import { type SettingsDto } from '@/api/settings/entities/settings.entities';

const icpSchema = z.object({
  name: z.string().trim().min(1, 'Required.').max(120),
  archetype: z.string().max(500),
  description: z.string().trim().min(1, 'Required.').max(2000),
  perceivedValue: z.string().max(500),
  angle: z.string().max(500),
  goldenRule: z.string().max(500),
});

export const settingsSchema = z.object({
  company: z.object({
    name: z.string().trim().min(1, 'Required.').max(200),
    website: z.string().trim().min(1, 'Required.').max(2048),
  }),
  resources: z.object({
    productPageUrl: z.string().max(2048),
    salesDeckUrl: z.string().max(2048),
  }),
  outreachLanguage: z.string().min(2).max(10),
  companyProfile: z.string().max(5000),
  followUp: z.object({
    intervals: z
      .array(z.number('Enter a number of days.').int().min(1).max(60))
      .min(1, 'Add at least one follow-up.')
      .max(10),
    excludedWeekdays: z.array(z.number().int().min(0).max(6)),
  }),
  icps: z.array(icpSchema).min(1, 'Add at least one ICP.').max(3),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

export const EMPTY_ICP: SettingsFormValues['icps'][number] = {
  name: '',
  archetype: '',
  description: '',
  perceivedValue: '',
  angle: '',
  goldenRule: '',
};

export const DEFAULT_SETTINGS: SettingsFormValues = {
  company: { name: '', website: '' },
  resources: { productPageUrl: '', salesDeckUrl: '' },
  outreachLanguage: 'fr',
  companyProfile: '',
  followUp: { intervals: [3, 4], excludedWeekdays: [6, 0] },
  icps: [],
};

export const WEEKDAYS: ReadonlyArray<Readonly<{ value: number; label: string }>> = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

export const toFormValues = (data: SettingsDto): SettingsFormValues => ({
  company: { ...data.company },
  resources: { ...data.resources },
  outreachLanguage: data.outreachLanguage,
  companyProfile: data.companyProfile,
  followUp: {
    intervals: [...data.followUp.intervals],
    excludedWeekdays: [...data.followUp.excludedWeekdays],
  },
  icps: data.icps.map((icp) => ({ ...icp })),
});

export const LANGUAGES: ReadonlyArray<Readonly<{ code: string; label: string }>> = [
  { code: 'fr', label: 'French' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'nl', label: 'Dutch' },
  { code: 'pt', label: 'Portuguese' },
];
