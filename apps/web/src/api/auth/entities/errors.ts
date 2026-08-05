export enum SignInErrors {
  invalidCredentials = 'invalidCredentials',
  signInFailed = 'signInFailed',
}

export enum VerificationErrors {
  rateLimited = 'rateLimited',
  sendFailed = 'sendFailed',
}

export enum PasswordResetErrors {
  rateLimited = 'rateLimited',
  invalidToken = 'invalidToken',
  requestFailed = 'requestFailed',
  resetFailed = 'resetFailed',
}

export enum SessionErrors {
  unauthenticated = 'unauthenticated',
  signOutFailed = 'signOutFailed',
}

export const BETTER_AUTH_INVALID_CREDENTIALS_CODES: ReadonlyArray<string> = [
  'INVALID_EMAIL_OR_PASSWORD',
  'USER_NOT_FOUND',
];
