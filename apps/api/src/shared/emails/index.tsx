import { renderEmail } from "./render.ts";
import { VerifyEmail } from "./templates/VerifyEmail.tsx";
import { ResetPassword } from "./templates/ResetPassword.tsx";
import { ChangeEmail } from "./templates/ChangeEmail.tsx";
import { OrganizationInvitation } from "./templates/OrganizationInvitation.tsx";
import { AgentRecap } from "./templates/AgentRecap.tsx";

export type BuiltEmail = Readonly<{
  subject: string;
  html: string;
  text: string;
}>;

export async function buildVerifyEmail(
  props: Readonly<{ firstName: string; url: string }>
): Promise<BuiltEmail> {
  const { html, text } = await renderEmail(<VerifyEmail {...props} />);
  return { subject: "Confirm your Tanchi email", html, text };
}

export async function buildResetPasswordEmail(
  props: Readonly<{ firstName: string; url: string }>
): Promise<BuiltEmail> {
  const { html, text } = await renderEmail(<ResetPassword {...props} />);
  return { subject: "Reset your Tanchi password", html, text };
}

export async function buildChangeEmailEmail(
  props: Readonly<{ firstName: string; newEmail: string; url: string }>
): Promise<BuiltEmail> {
  const { html, text } = await renderEmail(<ChangeEmail {...props} />);
  return { subject: "Confirm your new Tanchi email", html, text };
}

export async function buildOrganizationInvitationEmail(
  props: Readonly<{
    organizationName: string;
    inviterName: string;
    url: string;
  }>
): Promise<BuiltEmail> {
  const { html, text } = await renderEmail(
    <OrganizationInvitation {...props} />
  );
  return {
    subject: `Join ${props.organizationName} on Tanchi`,
    html,
    text,
  };
}

export async function buildAgentRecapEmail(
  props: Readonly<{
    firstName: string;
    organizationName: string;
    sourced: number;
    profiled: number;
    drafted: number;
    appUrl: string;
  }>
): Promise<BuiltEmail> {
  const { html, text } = await renderEmail(<AgentRecap {...props} />);
  return {
    subject: `Tanchi — ${props.drafted} message(s) ready to review`,
    html,
    text,
  };
}
