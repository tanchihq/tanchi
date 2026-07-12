export type SignedUpUserDto = Readonly<{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
}>;

export type SignedUpOrganizationDto = Readonly<{
  id: string;
  name: string;
  slug: string;
}>;

export type SignedUpDto = Readonly<{
  user: SignedUpUserDto;
  organization: SignedUpOrganizationDto;
}>;
