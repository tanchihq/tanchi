export type AuthUserDto = Readonly<{
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
}>;

// Réponse de Better Auth sur /auth/sign-in/email. La session est posée en
// cookie httpOnly ; on ne dépend pas du token côté front.
export type SignInResponseDto = Readonly<{
  token: string;
  user: AuthUserDto;
}>;

// Réponse de GET /me (utilisateur courant + session).
export type MeUserDto = Readonly<{
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
}>;

export type MeSessionDto = Readonly<{
  activeOrganizationId: string | null;
}>;

export type MeDto = Readonly<{
  user: MeUserDto;
  session: MeSessionDto;
}>;
