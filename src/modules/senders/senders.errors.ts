export enum CreateSenderErrors {
  noActiveOrganization = "noActiveOrganization",
  invalidFromName = "invalidFromName",
  invalidFromEmail = "invalidFromEmail",
  invalidHost = "invalidHost",
  invalidPort = "invalidPort",
  invalidUsername = "invalidUsername",
  invalidSecret = "invalidSecret",
  invalidDailyCap = "invalidDailyCap",
  invalidSignature = "invalidSignature",
  createFailed = "createFailed",
}

export enum ListSendersErrors {
  noActiveOrganization = "noActiveOrganization",
}

export enum DeleteSenderErrors {
  noActiveOrganization = "noActiveOrganization",
  invalidSenderId = "invalidSenderId",
  inexistingSender = "inexistingSender",
  notInMyOrg = "notInMyOrg",
  deleteFailed = "deleteFailed",
}

export enum TestSenderErrors {
  noActiveOrganization = "noActiveOrganization",
  invalidSenderId = "invalidSenderId",
  inexistingSender = "inexistingSender",
  notInMyOrg = "notInMyOrg",
  connectionFailed = "connectionFailed",
}
