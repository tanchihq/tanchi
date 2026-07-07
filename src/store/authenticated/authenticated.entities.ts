export type AuthUser = Readonly<{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  emailVerified: boolean;
  activeOrganizationId: string | null;
}>;

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type OnboardingStatusState = 'unknown' | 'in_progress' | 'completed';

export type AuthState = Readonly<{
  status: SessionStatus;
  user: AuthUser | null;
  onboarding: OnboardingStatusState;
}>;
