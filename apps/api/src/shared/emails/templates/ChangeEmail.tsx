import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout, sharedStyles } from "../components/EmailLayout.tsx";

type ChangeEmailProps = Readonly<{
  firstName: string;
  newEmail: string;
  url: string;
}>;

export function ChangeEmail({ firstName, newEmail, url }: ChangeEmailProps) {
  return (
    <EmailLayout preview="Confirm the email change on your Tanchi account">
      <Heading style={sharedStyles.heading}>Confirm your new email</Heading>
      <Text style={sharedStyles.paragraph}>
        {firstName === "" ? "Hi," : `Hi ${firstName},`} a request to change your
        email to <strong>{newEmail}</strong> was made on your account. Confirm to
        apply it.
      </Text>
      <Section style={{ padding: "8px 0 4px" }}>
        <Button href={url} style={sharedStyles.button}>
          Confirm the change
        </Button>
      </Section>
      <Text style={sharedStyles.paragraph}>
        If you didn't request this, just ignore this email — your current address
        stays active.
      </Text>
      <Text style={sharedStyles.linkFallback}>
        If the button doesn't work, copy this link: {url}
      </Text>
    </EmailLayout>
  );
}
