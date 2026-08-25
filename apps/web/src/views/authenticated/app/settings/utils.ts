import { z } from 'zod';
import { type SettingsDto } from '@/api/settings/entities/settings.entities';

const icpSchema = z.object({
  id: z.string().nullable(),
  name: z.string().trim().min(1, 'Required.').max(120),
  archetype: z.string().max(500),
  description: z.string().trim().min(1, 'Required.').max(2000),
  perceivedValue: z.string().max(500),
  angle: z.string().max(500),
  goldenRule: z.string().max(500),
});

const marketSchema = z.object({
  id: z.string().nullable(),
  name: z.string().trim().min(1, 'Required.').max(120),
  country: z.string().trim().length(2),
  outreachLanguage: z.string().min(2).max(10),
  companyProfile: z.string().max(5000),
  leadsPerDay: z.number('Enter a number.').int().min(1).max(200),
  followUp: z.object({
    intervals: z
      .array(z.number('Enter a number of days.').int().min(1).max(60))
      .min(1, 'Add at least one follow-up.')
      .max(10),
    excludedWeekdays: z
      .array(z.number().int().min(0).max(6))
      .max(6, 'Keep at least one active day.'),
  }),
  icps: z.array(icpSchema).min(1, 'Add at least one profile.').max(3),
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
  markets: z.array(marketSchema).min(1, 'Add at least one market.').max(25),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

export const EMPTY_ICP: SettingsFormValues['markets'][number]['icps'][number] = {
  id: null,
  name: '',
  archetype: '',
  description: '',
  perceivedValue: '',
  angle: '',
  goldenRule: '',
};

export const EMPTY_MARKET: SettingsFormValues['markets'][number] = {
  id: null,
  name: '',
  country: 'US',
  outreachLanguage: 'en',
  companyProfile: '',
  leadsPerDay: 15,
  followUp: { intervals: [3, 4], excludedWeekdays: [6, 0] },
  icps: [EMPTY_ICP],
};

export const DEFAULT_SETTINGS: SettingsFormValues = {
  company: { name: '', website: '' },
  resources: { productPageUrl: '', salesDeckUrl: '' },
  markets: [EMPTY_MARKET],
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
  resources: {
    productPageUrl: data.resources.productPageUrl ?? '',
    salesDeckUrl: data.resources.salesDeckUrl ?? '',
  },
  markets: data.markets.map((market) => ({
    id: market.id,
    name: market.name,
    country: market.country,
    outreachLanguage: market.outreachLanguage,
    companyProfile: market.companyProfile,
    leadsPerDay: market.leadsPerDay,
    followUp: {
      intervals: [...market.followUp.intervals],
      excludedWeekdays: [...market.followUp.excludedWeekdays],
    },
    icps: market.icps.map((icp) => ({ ...icp })),
  })),
});

const MONTHLY_LEADS_REFERENCE = 200;
const MIN_LEADS_PER_BUCKET = 35;

export const countLearningBuckets = (markets: SettingsFormValues['markets']): number =>
  markets.reduce((total, market) => total + market.icps.length, 0);

export const learningDilutionWarning = (
  markets: SettingsFormValues['markets'],
): string | null => {
  const buckets = countLearningBuckets(markets);
  if (buckets <= 0) return null;
  const leadsPerBucket = Math.floor(MONTHLY_LEADS_REFERENCE / buckets);
  if (leadsPerBucket >= MIN_LEADS_PER_BUCKET) return null;
  return `You have ${buckets} profiles across your markets — about ${leadsPerBucket} leads/month each. Below ~${MIN_LEADS_PER_BUCKET}, the AI has too little signal to learn well per profile. Consider fewer profiles or markets.`;
};


