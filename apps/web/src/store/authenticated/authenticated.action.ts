import {
  type AuthUser,
  type OnboardingStatusState,
} from './authenticated.entities';

export type AuthAction =
  | Readonly<{ type: 'SESSION_LOADING' }>
  | Readonly<{
      type: 'AUTHENTICATED';
      user: AuthUser;
      onboarding: OnboardingStatusState;
      isEmailVerificationRequired: boolean;
    }>
  | Readonly<{ type: 'UPDATE_USER'; user: AuthUser }>
  | Readonly<{ type: 'ONBOARDING_COMPLETED' }>
  | Readonly<{ type: 'UNAUTHENTICATED' }>;
