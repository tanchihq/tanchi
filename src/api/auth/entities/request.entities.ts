export type SignInDto = Readonly<{
  email: string;
  password: string;
}>;

export type ResendVerificationEmailDto = Readonly<{
  email: string;
  callbackURL: string;
}>;
