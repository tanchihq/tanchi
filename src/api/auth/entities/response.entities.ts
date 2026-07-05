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
