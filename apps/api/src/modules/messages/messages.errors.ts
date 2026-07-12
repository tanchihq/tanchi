export enum GetMessagesErrors {
  noActiveOrganization = "noActiveOrganization",
}

export enum EditMessageErrors {
  invalidMessageId = "invalidMessageId",
  invalidSubject = "invalidSubject",
  invalidBody = "invalidBody",
  noActiveOrganization = "noActiveOrganization",
  inexistingMessage = "inexistingMessage",
  notInMyOrg = "notInMyOrg",
  notEditable = "notEditable",
  updateFailed = "updateFailed",
}
