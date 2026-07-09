export enum GetProspectsErrors {
  noActiveOrganization = "noActiveOrganization",
}

export enum GetProspectErrors {
  invalidProspectId = "invalidProspectId",
  noActiveOrganization = "noActiveOrganization",
  inexistingProspect = "inexistingProspect",
  notInMyOrg = "notInMyOrg",
}

export enum UpdateStageErrors {
  invalidProspectId = "invalidProspectId",
  invalidStage = "invalidStage",
  invalidOrigin = "invalidOrigin",
  noActiveOrganization = "noActiveOrganization",
  inexistingProspect = "inexistingProspect",
  notInMyOrg = "notInMyOrg",
  updateFailed = "updateFailed",
}

export enum DeleteProspectErrors {
  invalidProspectId = "invalidProspectId",
  invalidScope = "invalidScope",
  invalidReason = "invalidReason",
  noActiveOrganization = "noActiveOrganization",
  inexistingProspect = "inexistingProspect",
  notInMyOrg = "notInMyOrg",
  deleteFailed = "deleteFailed",
}

export enum ContactProspectErrors {
  invalidProspectId = "invalidProspectId",
  noActiveOrganization = "noActiveOrganization",
  inexistingProspect = "inexistingProspect",
  notInMyOrg = "notInMyOrg",
  noDraft = "noDraft",
  noSender = "noSender",
  sendFailed = "sendFailed",
}

export enum ValidateProspectErrors {
  invalidProspectId = "invalidProspectId",
  noActiveOrganization = "noActiveOrganization",
  inexistingProspect = "inexistingProspect",
  notInMyOrg = "notInMyOrg",
  noDraft = "noDraft",
  noSender = "noSender",
  sendFailed = "sendFailed",
}
