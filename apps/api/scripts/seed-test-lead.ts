import { closeDb, db } from "../src/db.ts";

const SUBJECT = "Test Tanchi — envoi SMTP";
const BODY =
  "Bonjour,\n\nCeci est un email de test envoyé depuis Tanchi. Si tu reçois ce message, l'envoi SMTP fonctionne de bout en bout.\n\nÀ très vite,\nL'agent Tanchi";

async function main(): Promise<void> {
  try {
    const orgs = await db<Array<{ id: string }>>`
      SELECT id FROM organization ORDER BY created_at DESC LIMIT 1
    `;
    const org = orgs[0];
    if (!org) {
      console.error("Aucune organisation en base — fais l'onboarding d'abord.");
      process.exit(1);
    }
    const organizationId = org.id;

    const icps = await db<Array<{ id: string }>>`
      SELECT id FROM icp WHERE organization_id = ${organizationId}
      ORDER BY position ASC LIMIT 1
    `;
    const icpId = icps[0]?.id ?? null;

    const companyId = Bun.randomUUIDv7();
    await db`
      INSERT INTO companies (id, organization_id, name, domain, website, sector, size, hq)
      VALUES (${companyId}, ${organizationId}, 'SweeScape Test', 'sweescape.com',
              'https://sweescape.com', 'SaaS', '1-10', 'Paris')
    `;

    const leadId = Bun.randomUUIDv7();
    await db`
      INSERT INTO leads (
        id, organization_id, company_id, icp_id, first_name, last_name, role,
        email, email_status, channel, stage, origin, hot, score, qualification,
        source_provider
      )
      VALUES (
        ${leadId}, ${organizationId}, ${companyId}, ${icpId}, 'Contact', 'SweeScape',
        'CEO', 'contact@sweescape.com', 'verified', 'email', 'identified', 'manual',
        true, 90, 'A', 'manual'
      )
    `;

    const messageId = Bun.randomUUIDv7();
    await db`
      INSERT INTO messages (
        id, organization_id, lead_id, icp_id, channel, subject, body, status,
        origin, angle_type, length_bucket
      )
      VALUES (
        ${messageId}, ${organizationId}, ${leadId}, ${icpId}, 'email',
        ${SUBJECT}, ${BODY}, 'draft', 'manual', 'curiosity', 'short'
      )
    `;

    console.log(`✓ Prospect créé : ${leadId}`);
    console.log("  email    : contact@sweescape.com");
    console.log("  stage    : identified (brouillon prêt)");
    console.log(`  Envoyer  : POST /api/v1/prospects/${leadId}/contact`);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

main();
