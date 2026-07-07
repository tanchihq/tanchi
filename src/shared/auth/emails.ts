import { env } from "../../env.ts";
import { sendSystemEmail } from "@shared/mailer";
import {
  buildChangeEmailEmail,
  buildOrganizationInvitationEmail,
  buildResetPasswordEmail,
  buildVerifyEmail,
} from "@shared/emails";

type EmailUser = Readonly<{ email: string; name: string }>;

function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

export const sendResetPasswordEmail = async ({
  user,
  url,
}: Readonly<{ user: EmailUser; url: string }>): Promise<void> => {
  const email = await buildResetPasswordEmail({
    firstName: firstNameOf(user.name),
    url,
  });
  await sendSystemEmail({ to: user.email, ...email });
};

export const sendVerificationEmail = async ({
  user,
  url,
}: Readonly<{ user: EmailUser; url: string }>): Promise<void> => {
  const email = await buildVerifyEmail({
    firstName: firstNameOf(user.name),
    url,
  });
  await sendSystemEmail({ to: user.email, ...email });
};

export const sendChangeEmailConfirmation = async ({
  user,
  newEmail,
  url,
}: Readonly<{
  user: EmailUser;
  newEmail: string;
  url: string;
}>): Promise<void> => {
  const email = await buildChangeEmailEmail({
    firstName: firstNameOf(user.name),
    newEmail,
    url,
  });
  await sendSystemEmail({ to: user.email, ...email });
};

export const sendOrganizationInvitationEmail = async ({
  email,
  inviter,
  organization,
  invitation,
}: Readonly<{
  email: string;
  inviter: Readonly<{ user: EmailUser }>;
  organization: Readonly<{ name: string }>;
  invitation: Readonly<{ id: string }>;
}>): Promise<void> => {
  const built = await buildOrganizationInvitationEmail({
    organizationName: organization.name,
    inviterName: firstNameOf(inviter.user.name),
    url: `${env.APP_URL}/accept-invitation/${invitation.id}`,
  });
  await sendSystemEmail({ to: email, ...built });
};
