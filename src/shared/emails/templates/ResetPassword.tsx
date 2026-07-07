import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout, sharedStyles } from "../components/EmailLayout.tsx";

type ResetPasswordProps = Readonly<{
  firstName: string;
  url: string;
}>;

export function ResetPassword({ firstName, url }: ResetPasswordProps) {
  return (
    <EmailLayout preview="Réinitialise ton mot de passe SweeLeads">
      <Heading style={sharedStyles.heading}>
        Réinitialisation du mot de passe
      </Heading>
      <Text style={sharedStyles.paragraph}>
        {firstName === "" ? "Bonjour," : `Bonjour ${firstName},`} tu as demandé
        à réinitialiser ton mot de passe. Clique ci-dessous pour en choisir un
        nouveau. Ce lien expire bientôt.
      </Text>
      <Section style={{ padding: "8px 0 4px" }}>
        <Button href={url} style={sharedStyles.button}>
          Choisir un nouveau mot de passe
        </Button>
      </Section>
      <Text style={sharedStyles.paragraph}>
        Si tu n'es pas à l'origine de cette demande, ignore cet email : ton mot
        de passe reste inchangé.
      </Text>
      <Text style={sharedStyles.linkFallback}>
        Si le bouton ne fonctionne pas, copie ce lien : {url}
      </Text>
    </EmailLayout>
  );
}
