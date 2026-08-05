import { type AuthState } from './authenticated.entities';

export const INITIAL_AUTH_STATE: AuthState = {
  status: 'loading',
  user: null,
  onboarding: 'unknown',
  isEmailVerificationRequired: false,
};
