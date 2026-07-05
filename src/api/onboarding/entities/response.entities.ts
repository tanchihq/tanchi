import { type CompleteOnboardingDto } from './request.entities';

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

export type OnboardingStatus = 'in_progress' | 'completed';

export type OnboardingStateDto = Readonly<{
  status: OnboardingStatus;
  step: number;
  draft: CompleteOnboardingDto;
}>;
