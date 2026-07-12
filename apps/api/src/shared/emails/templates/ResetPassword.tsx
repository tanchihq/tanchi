import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout, sharedStyles } from "../components/EmailLayout.tsx";

type ResetPasswordProps = Readonly<{
  firstName: string;
  url: string;
}>;

export function ResetPassword({ firstName, url }: ResetPasswordProps) {
  return (
    <EmailLayout preview="Reset your Tanchi password">
      <Heading style={sharedStyles.heading}>Reset your password</Heading>
      <Text style={sharedStyles.paragraph}>
        {firstName === "" ? "Hi," : `Hi ${firstName},`} you requested to reset
        your password. Click below to choose a new one. This link expires soon.
      </Text>
      <Section style={{ padding: "8px 0 4px" }}>
        <Button href={url} style={sharedStyles.button}>
          Choose a new password
        </Button>
      </Section>
      <Text style={sharedStyles.paragraph}>
        If you didn't request this, just ignore this email — your password stays
        unchanged.
      </Text>
      <Text style={sharedStyles.linkFallback}>
        If the button doesn't work, copy this link: {url}
      </Text>
    </EmailLayout>
  );
}
