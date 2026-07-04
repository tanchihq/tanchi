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

// 'unknown' : session résolue mais statut d'onboarding pas encore connu
// (ex. échec transitoire du fetch) — traité comme "à compléter".
export type OnboardingStatusState = 'unknown' | 'in_progress' | 'completed';

export type AuthState = Readonly<{
  status: SessionStatus;
  user: AuthUser | null;
  onboarding: OnboardingStatusState;
}>;
