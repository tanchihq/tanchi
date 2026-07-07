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
    <EmailLayout
      preview={`Rejoins ${organizationName} sur SweeLeads`}
    >
      <Heading style={sharedStyles.heading}>
        Tu es invité·e sur {organizationName}
      </Heading>
      <Text style={sharedStyles.paragraph}>
        {inviterName === ""
          ? "Quelqu'un"
          : inviterName}{" "}
        t'invite à rejoindre l'espace <strong>{organizationName}</strong> sur
        SweeLeads. Accepte pour accéder aux prospects, dossiers et séquences de
        l'équipe.
      </Text>
      <Section style={{ padding: "8px 0 4px" }}>
        <Button href={url} style={sharedStyles.button}>
          Rejoindre {organizationName}
        </Button>
      </Section>
      <Text style={sharedStyles.linkFallback}>
        Si le bouton ne fonctionne pas, copie ce lien : {url}
      </Text>
    </EmailLayout>
  );
}
