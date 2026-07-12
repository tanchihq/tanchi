export enum CreateConversationErrors {
  noActiveOrganization = "noActiveOrganization",
  invalidTitle = "invalidTitle",
  createFailed = "createFailed",
}

export enum GetConversationsErrors {
  noActiveOrganization = "noActiveOrganization",
}

export enum GetConversationErrors {
  invalidConversationId = "invalidConversationId",
  noActiveOrganization = "noActiveOrganization",
  inexistingConversation = "inexistingConversation",
  notInMyOrg = "notInMyOrg",
}

export enum SendMessageErrors {
  invalidConversationId = "invalidConversationId",
  invalidContent = "invalidContent",
  noActiveOrganization = "noActiveOrganization",
  inexistingConversation = "inexistingConversation",
  notInMyOrg = "notInMyOrg",
  llmFailed = "llmFailed",
  sendFailed = "sendFailed",
}

export enum AttachLeadErrors {
  invalidConversationId = "invalidConversationId",
  invalidLeadId = "invalidLeadId",
  noActiveOrganization = "noActiveOrganization",
  inexistingConversation = "inexistingConversation",
  notInMyOrg = "notInMyOrg",
  inexistingLead = "inexistingLead",
  attachFailed = "attachFailed",
}

export enum DetachLeadErrors {
  invalidConversationId = "invalidConversationId",
  invalidLeadId = "invalidLeadId",
  noActiveOrganization = "noActiveOrganization",
  inexistingConversation = "inexistingConversation",
  notInMyOrg = "notInMyOrg",
  detachFailed = "detachFailed",
}

export enum DeleteConversationErrors {
  invalidConversationId = "invalidConversationId",
  noActiveOrganization = "noActiveOrganization",
  inexistingConversation = "inexistingConversation",
  notInMyOrg = "notInMyOrg",
  deleteFailed = "deleteFailed",
}
