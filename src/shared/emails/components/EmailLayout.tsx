import type { ReactNode } from "react";
import {
  Body,
  Container,
  Font,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { fontStack, palette, radius } from "../theme.ts";

type EmailLayoutProps = Readonly<{
  preview: string;
  children: ReactNode;
}>;

const main = {
  backgroundColor: palette.paper,
  fontFamily: fontStack,
  margin: 0,
  padding: "40px 0",
};

const container = {
  width: "100%",
  maxWidth: "560px",
  margin: "0 auto",
  padding: "0 24px",
};

const card = {
  backgroundColor: palette.card,
  borderRadius: radius.card,
  border: `1px solid ${palette.sand}`,
  padding: "40px",
};

const brandRow = {
  paddingBottom: "28px",
};

const wordmark = {
  fontFamily: fontStack,
  fontSize: "19px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: palette.ink,
  margin: 0,
};

const wordmarkAccent = {
  color: palette.brand,
};

const footer = {
  padding: "24px 8px 0",
};

const footerText = {
  fontFamily: fontStack,
  fontSize: "12px",
  lineHeight: "18px",
  color: palette.inkFaint,
  margin: 0,
};

const footerLink = {
  color: palette.inkSoft,
  textDecoration: "underline",
};

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="fr">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            <Section style={brandRow}>
              <Text style={wordmark}>
                Swee<span style={wordmarkAccent}>Leads</span>
              </Text>
            </Section>
            {children}
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              SweeLeads — prospection sourcée, sans jamais inventer un fait.
            </Text>
            <Text style={footerText}>
              Tu reçois cet email parce que tu as un compte SweeLeads.{" "}
              <Link href="https://sweeleads.com" style={footerLink}>
                sweeleads.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const sharedStyles = {
  heading: {
    fontFamily: fontStack,
    fontSize: "24px",
    lineHeight: "30px",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: palette.ink,
    margin: "0 0 12px",
  },
  paragraph: {
    fontFamily: fontStack,
    fontSize: "15px",
    lineHeight: "24px",
    color: palette.inkSoft,
    margin: "0 0 16px",
  },
  button: {
    backgroundColor: palette.brand,
    borderRadius: radius.well,
    color: "#ffffff",
    fontFamily: fontStack,
    fontSize: "15px",
    fontWeight: 600,
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "13px 26px",
  },
  linkFallback: {
    fontFamily: fontStack,
    fontSize: "13px",
    lineHeight: "20px",
    color: palette.inkFaint,
    margin: "16px 0 0",
    wordBreak: "break-all" as const,
  },
  link: {
    color: palette.brand,
    textDecoration: "underline",
  },
  divider: {
    borderColor: palette.sandSoft,
    margin: "28px 0",
  },
} as const;
