type EmailUser = Readonly<{ email: string; name: string }>;

export const sendResetPasswordEmail = async ({
  user,
  url,
}: Readonly<{ user: EmailUser; url: string }>): Promise<void> => {
  console.log(`[auth:email] reset password pour ${user.email} → ${url}`);
};

export const sendVerificationEmail = async ({
  user,
  url,
}: Readonly<{ user: EmailUser; url: string }>): Promise<void> => {
  console.log(`[auth:email] vérification email pour ${user.email} → ${url}`);
};

export const sendChangeEmailConfirmation = async ({
  user,
  newEmail,
  url,
}: Readonly<{ user: EmailUser; newEmail: string; url: string }>): Promise<void> => {
  console.log(
    `[auth:email] confirmation changement d'email ${user.email} → ${newEmail} : ${url}`
  );
};

export const sendOrganizationInvitationEmail = async ({
  email,
  organization,
  invitation,
}: Readonly<{
  email: string;
  inviter: Readonly<{ user: EmailUser }>;
  organization: Readonly<{ name: string }>;
  invitation: Readonly<{ id: string }>;
}>): Promise<void> => {
  console.log(
    `[auth:email] invitation à rejoindre ${organization.name} pour ${email} (invitation ${invitation.id})`
  );
};
