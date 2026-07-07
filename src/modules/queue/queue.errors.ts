export enum GetQueueErrors {
  noActiveOrganization = "noActiveOrganization",
}

export enum EditQueueErrors {
  invalidProspectId = "invalidProspectId",
  invalidMessage = "invalidMessage",
  noActiveOrganization = "noActiveOrganization",
  inexistingDraft = "inexistingDraft",
  notInMyOrg = "notInMyOrg",
  editFailed = "editFailed",
}

export enum ValidateQueueErrors {
  invalidProspectId = "invalidProspectId",
  noActiveOrganization = "noActiveOrganization",
  inexistingDraft = "inexistingDraft",
  notInMyOrg = "notInMyOrg",
  noSender = "noSender",
  sendFailed = "sendFailed",
}
