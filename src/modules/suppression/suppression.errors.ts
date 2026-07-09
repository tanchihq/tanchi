export enum ImportSuppressionErrors {
  noActiveOrganization = "noActiveOrganization",
  invalidFile = "invalidFile",
  noEmailsFound = "noEmailsFound",
  importFailed = "importFailed",
}

export enum GetSuppressionErrors {
  noActiveOrganization = "noActiveOrganization",
}

export enum DeleteExclusionErrors {
  noActiveOrganization = "noActiveOrganization",
  invalidExclusionId = "invalidExclusionId",
  inexistingExclusion = "inexistingExclusion",
  deleteFailed = "deleteFailed",
}
