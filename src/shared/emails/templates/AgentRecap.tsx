import {
  Button,
  Column,
  Heading,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { EmailLayout, sharedStyles } from "../components/EmailLayout.tsx";
import { fontStack, palette, radius } from "../theme.ts";

type AgentRecapProps = Readonly<{
  firstName: string;
  organizationName: string;
  sourced: number;
  profiled: number;
  drafted: number;
  appUrl: string;
}>;

const statCell = {
  backgroundColor: palette.brandTintSoft,
  borderRadius: radius.well,
  border: `1px solid ${palette.brandTint}`,
  padding: "16px 8px",
  textAlign: "center" as const,
};

const statValue = {
  fontFamily: fontStack,
  fontSize: "30px",
  lineHeight: "34px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: palette.brand,
  margin: 0,
};

const statLabel = {
  fontFamily: fontStack,
  fontSize: "12px",
  lineHeight: "16px",
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  color: palette.inkSoft,
  margin: "6px 0 0",
};

const gutter = { width: "12px" } as const;

export function AgentRecap({
  firstName,
  organizationName,
  sourced,
  profiled,
  drafted,
  appUrl,
}: AgentRecapProps) {
  return (
    <EmailLayout
      preview={`Le run de cette nuit : ${drafted} message(s) prêts à relire`}
    >
      <Heading style={sharedStyles.heading}>
        Ton agent a terminé sa nuit
      </Heading>
      <Text style={sharedStyles.paragraph}>
        {firstName === "" ? "Bonjour," : `Bonjour ${firstName},`} voici ce que
        l'agent a produit pour <strong>{organizationName}</strong> sur le dernier
        run.
      </Text>
      <Section style={{ padding: "8px 0 4px" }}>
        <Row>
          <Column style={statCell}>
            <Text style={statValue}>{sourced}</Text>
            <Text style={statLabel}>Sourcés</Text>
          </Column>
          <Column style={gutter} />
          <Column style={statCell}>
            <Text style={statValue}>{profiled}</Text>
            <Text style={statLabel}>Renseignés</Text>
          </Column>
          <Column style={gutter} />
          <Column style={statCell}>
            <Text style={statValue}>{drafted}</Text>
            <Text style={statLabel}>Rédigés</Text>
          </Column>
        </Row>
      </Section>
      <Text style={{ ...sharedStyles.paragraph, margin: "24px 0 16px" }}>
        {drafted === 0
          ? "Aucun nouveau message à relire cette fois — l'agent continue de chercher."
          : "Les messages t'attendent : relis, ajuste au besoin, puis laisse partir."}
      </Text>
      <Section style={{ padding: "4px 0" }}>
        <Button href={appUrl} style={sharedStyles.button}>
          Relire mes messages
        </Button>
      </Section>
    </EmailLayout>
  );
}
