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
