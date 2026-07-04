import { type CompleteOnboardingDto } from './request.entities';

// Miroir de `SignedUpDto` du back.
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

// État persistant de l'onboarding, pour la reprise après avoir quitté la page.
export type OnboardingStatus = 'in_progress' | 'completed';

export type OnboardingStateDto = Readonly<{
  status: OnboardingStatus;
  step: number;
  draft: CompleteOnboardingDto;
}>;
