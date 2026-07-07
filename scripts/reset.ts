import { closeDb, db } from "../src/db.ts";

async function main(): Promise<void> {
  try {
    await db`
      TRUNCATE TABLE
        activity, outcomes, edits, messages,
        dossier_angles, dossier_facts, dossiers,
        leads, companies
      RESTART IDENTITY CASCADE
    `;
    console.log(
      "✓ Données opérationnelles effacées (leads, companies, dossiers, messages, edits, outcomes, activity)."
    );
    console.log(
      "  Config conservée : organization, organization_profile, senders, icp, suppression_list, playbook, auth."
    );
  } catch (err) {
    console.error("Reset failed:", err);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

main();
