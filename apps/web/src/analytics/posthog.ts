import posthog from 'posthog-js';
import { type AuthUser } from '@/store/authenticated/authenticated.entities';

const key = import.meta.env.VITE_POSTHOG_KEY;
const host = import.meta.env.VITE_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

export const initAnalytics = () => {
  if (key === undefined || key === '') return;
  posthog.init(key, {
    api_host: host,
    defaults: '2025-05-24',
  });
};

export const identifyUser = (user: AuthUser) => {
  if (key === undefined || key === '') return;
  posthog.identify(user.id, {
    email: user.email,
    name: user.name,
    organizationId: user.activeOrganizationId,
  });
};

export const resetAnalytics = () => {
  if (key === undefined || key === '') return;
  posthog.reset();
};
