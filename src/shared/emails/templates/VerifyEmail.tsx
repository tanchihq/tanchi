import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout, sharedStyles } from "../components/EmailLayout.tsx";

type VerifyEmailProps = Readonly<{
  firstName: string;
  url: string;
}>;

export function VerifyEmail({ firstName, url }: VerifyEmailProps) {
  return (
    <EmailLayout preview="Confirme ton adresse pour activer ton compte SweeLeads">
      <Heading style={sharedStyles.heading}>
        Bienvenue{firstName === "" ? "" : ` ${firstName}`} 👋
      </Heading>
      <Text style={sharedStyles.paragraph}>
        Encore une étape : confirme ton adresse email pour activer ton compte
        SweeLeads et lancer ta première prospection.
      </Text>
      <Section style={{ padding: "8px 0 4px" }}>
        <Button href={url} style={sharedStyles.button}>
          Confirmer mon adresse
        </Button>
      </Section>
      <Text style={sharedStyles.linkFallback}>
        Si le bouton ne fonctionne pas, copie ce lien : {url}
      </Text>
    </EmailLayout>
  );
}
