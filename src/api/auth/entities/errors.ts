// Erreurs de connexion. Better Auth renvoie un `code` machine dans le corps de
// la réponse d'erreur (ex. INVALID_EMAIL_OR_PASSWORD).
export enum SignInErrors {
  invalidCredentials = 'invalidCredentials',
  signInFailed = 'signInFailed',
}

export enum SessionErrors {
  unauthenticated = 'unauthenticated',
  signOutFailed = 'signOutFailed',
}

// Codes bruts renvoyés par Better Auth, mappés vers nos SignInErrors.
export const BETTER_AUTH_INVALID_CREDENTIALS_CODES: ReadonlyArray<string> = [
  'INVALID_EMAIL_OR_PASSWORD',
  'USER_NOT_FOUND',
];
