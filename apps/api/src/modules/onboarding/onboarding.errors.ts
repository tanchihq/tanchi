export enum SignUpErrors {
  invalidEmail = "invalidEmail",
  invalidPassword = "invalidPassword",
  invalidFirstName = "invalidFirstName",
  invalidLastName = "invalidLastName",
  invalidCompany = "invalidCompany",
  emailAlreadyExists = "emailAlreadyExists",
  signUpFailed = "signUpFailed",
  organizationCreationFailed = "organizationCreationFailed",
  signupDisabled = "signupDisabled",
}

export enum OnboardingStateErrors {
  noActiveOrganization = "noActiveOrganization",
}

export enum SaveOnboardingProgressErrors {
  noActiveOrganization = "noActiveOrganization",
  invalidDraft = "invalidDraft",
}

export enum CompleteOnboardingErrors {
  noActiveOrganization = "noActiveOrganization",
  invalidCompanyName = "invalidCompanyName",
  invalidWebsite = "invalidWebsite",
  invalidResource = "invalidResource",
  invalidIcp = "invalidIcp",
  tooManyIcps = "tooManyIcps",
  onboardingFailed = "onboardingFailed",
}

export enum GenerateProfileErrors {
  invalidWebsite = "invalidWebsite",
  generationFailed = "generationFailed",
}
