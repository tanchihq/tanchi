import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout, sharedStyles } from "../components/EmailLayout.tsx";

type ChangeEmailProps = Readonly<{
  firstName: string;
  newEmail: string;
  url: string;
}>;

export function ChangeEmail({ firstName, newEmail, url }: ChangeEmailProps) {
  return (
    <EmailLayout preview="Confirme le changement d'adresse de ton compte SweeLeads">
      <Heading style={sharedStyles.heading}>Confirme ta nouvelle adresse</Heading>
      <Text style={sharedStyles.paragraph}>
        {firstName === "" ? "Bonjour," : `Bonjour ${firstName},`} une demande de
        changement d'adresse vers <strong>{newEmail}</strong> a été faite sur ton
        compte. Confirme pour l'appliquer.
      </Text>
      <Section style={{ padding: "8px 0 4px" }}>
        <Button href={url} style={sharedStyles.button}>
          Confirmer le changement
        </Button>
      </Section>
      <Text style={sharedStyles.paragraph}>
        Si tu n'es pas à l'origine de cette demande, ignore cet email : ton
        adresse actuelle reste active.
      </Text>
      <Text style={sharedStyles.linkFallback}>
        Si le bouton ne fonctionne pas, copie ce lien : {url}
      </Text>
    </EmailLayout>
  );
}
