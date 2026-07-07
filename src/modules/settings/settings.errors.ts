export enum GetSettingsErrors {
  noActiveOrganization = "noActiveOrganization",
}

export enum UpdateSettingsErrors {
  noActiveOrganization = "noActiveOrganization",
  invalidCompanyName = "invalidCompanyName",
  invalidWebsite = "invalidWebsite",
  invalidResource = "invalidResource",
  invalidLanguage = "invalidLanguage",
  invalidCompanyProfile = "invalidCompanyProfile",
  invalidFollowUp = "invalidFollowUp",
  invalidIcp = "invalidIcp",
  tooManyIcps = "tooManyIcps",
  updateFailed = "updateFailed",
}

export enum GenerateCompanyProfileErrors {
  noActiveOrganization = "noActiveOrganization",
  generationFailed = "generationFailed",
}
