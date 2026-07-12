import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout, sharedStyles } from "../components/EmailLayout.tsx";

type OrganizationInvitationProps = Readonly<{
  organizationName: string;
  inviterName: string;
  url: string;
}>;

export function OrganizationInvitation({
  organizationName,
  inviterName,
  url,
}: OrganizationInvitationProps) {
  return (
    <EmailLayout preview={`Join ${organizationName} on Tanchi`}>
      <Heading style={sharedStyles.heading}>
        You're invited to {organizationName}
      </Heading>
      <Text style={sharedStyles.paragraph}>
        {inviterName === "" ? "Someone" : inviterName} invited you to join the{" "}
        <strong>{organizationName}</strong> workspace on Tanchi. Accept to
        access the team's prospects, dossiers and sequences.
      </Text>
      <Section style={{ padding: "8px 0 4px" }}>
        <Button href={url} style={sharedStyles.button}>
          Join {organizationName}
        </Button>
      </Section>
      <Text style={sharedStyles.linkFallback}>
        If the button doesn't work, copy this link: {url}
      </Text>
    </EmailLayout>
  );
}
