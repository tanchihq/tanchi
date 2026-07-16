import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';
import { stripeClient } from '@better-auth/stripe/client';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL,
  basePath: '/api/v1/auth',
  fetchOptions: { credentials: 'include' },
  plugins: [organizationClient(), stripeClient({ subscription: true })],
});
