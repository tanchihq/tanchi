export enum SignUpErrors {
  invalidEmail = 'invalidEmail',
  invalidPassword = 'invalidPassword',
  invalidFirstName = 'invalidFirstName',
  invalidLastName = 'invalidLastName',
  invalidCompany = 'invalidCompany',
  emailAlreadyExists = 'emailAlreadyExists',
  signUpFailed = 'signUpFailed',
  organizationCreationFailed = 'organizationCreationFailed',
}

export enum CompleteOnboardingErrors {
  noActiveOrganization = 'noActiveOrganization',
  invalidCompanyName = 'invalidCompanyName',
  invalidWebsite = 'invalidWebsite',
  invalidResource = 'invalidResource',
  invalidIcp = 'invalidIcp',
  tooManyIcps = 'tooManyIcps',
  onboardingFailed = 'onboardingFailed',
}

export enum OnboardingProgressErrors {
  stateFetchFailed = 'stateFetchFailed',
  saveFailed = 'saveFailed',
}
