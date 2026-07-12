import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout, sharedStyles } from "../components/EmailLayout.tsx";

type VerifyEmailProps = Readonly<{
  firstName: string;
  url: string;
}>;

export function VerifyEmail({ firstName, url }: VerifyEmailProps) {
  return (
    <EmailLayout preview="Confirm your email to activate your Tanchi account">
      <Heading style={sharedStyles.heading}>
        Welcome{firstName === "" ? "" : ` ${firstName}`} 👋
      </Heading>
      <Text style={sharedStyles.paragraph}>
        One last step: confirm your email address to activate your Tanchi
        account and launch your first outreach.
      </Text>
      <Section style={{ padding: "8px 0 4px" }}>
        <Button href={url} style={sharedStyles.button}>
          Confirm my email
        </Button>
      </Section>
      <Text style={sharedStyles.linkFallback}>
        If the button doesn't work, copy this link: {url}
      </Text>
    </EmailLayout>
  );
}
