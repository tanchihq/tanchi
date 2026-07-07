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
  return { subject: "Confirme ton adresse SweeLeads", html, text };
}

export async function buildResetPasswordEmail(
  props: Readonly<{ firstName: string; url: string }>
): Promise<BuiltEmail> {
  const { html, text } = await renderEmail(<ResetPassword {...props} />);
  return { subject: "Réinitialise ton mot de passe SweeLeads", html, text };
}

export async function buildChangeEmailEmail(
  props: Readonly<{ firstName: string; newEmail: string; url: string }>
): Promise<BuiltEmail> {
  const { html, text } = await renderEmail(<ChangeEmail {...props} />);
  return { subject: "Confirme ta nouvelle adresse SweeLeads", html, text };
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
    subject: `Rejoins ${props.organizationName} sur SweeLeads`,
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
    subject: `SweeLeads — ${props.drafted} message(s) prêts à relire`,
    html,
    text,
  };
}
