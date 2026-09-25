import { beforeEach, describe, expect, it } from "bun:test";
import { createAccount } from "../helpers/client.ts";
import { db, truncateAll } from "../helpers/db.ts";
import { EnginePostgres } from "../../src/modules/engine/repository/engine/engine.postgres.ts";
import { EngineRepository } from "../../src/modules/engine/repository/engine/engine.repository.ts";
import {
  isIrrelevantMailbox,
  isSharedMailbox,
  rankContacts,
} from "../../src/modules/engine/agents/chasseur/chasseur.utils.ts";
import { MAX_SKIPPED_DRAFTS_PER_LEAD } from "../../src/modules/engine/engine.constants.ts";

const repository = new EngineRepository(new EnginePostgres(db));

const seedProfiledLead = async (
  organizationId: string,
  stage = "identified"
): Promise<string> => {
  const leadId = Bun.randomUUIDv7();
  await db`
    INSERT INTO leads (id, organization_id, email, channel, stage)
    VALUES (${leadId}, ${organizationId}, 'jane@prospect.test', 'email', ${stage})
  `;
  await db`
    INSERT INTO dossiers (id, organization_id, lead_id)
    VALUES (${Bun.randomUUIDv7()}, ${organizationId}, ${leadId})
  `;
  return leadId;
};

const seedMessage = async (
  organizationId: string,
  leadId: string,
  status: string,
  skipReason: string | null = null
): Promise<void> => {
  await db`
    INSERT INTO messages (id, organization_id, lead_id, channel, body, status, skip_reason)
    VALUES (${Bun.randomUUIDv7()}, ${organizationId}, ${leadId}, 'email', 'Draft', ${status}, ${skipReason})
  `;
};

const leadsNeedingCopy = async (organizationId: string) =>
  (await repository.getLeadsNeedingCopy(organizationId)).map((lead) => lead.id);

beforeEach(truncateAll);

describe("engine: redraft after a skipped draft", () => {
  it("drafts again for an identified lead whose only draft was skipped", async () => {
    const account = await createAccount();
    const leadId = await seedProfiledLead(account.organizationId);
    await seedMessage(account.organizationId, leadId, "skipped", "wrong_angle");
    expect(await leadsNeedingCopy(account.organizationId)).toEqual([leadId]);
  });

  it("does not draft while a draft is pending", async () => {
    const account = await createAccount();
    const leadId = await seedProfiledLead(account.organizationId);
    await seedMessage(account.organizationId, leadId, "skipped", "too_generic");
    await seedMessage(account.organizationId, leadId, "draft");
    expect(await leadsNeedingCopy(account.organizationId)).toEqual([]);
  });

  it(`stops after ${MAX_SKIPPED_DRAFTS_PER_LEAD} rejected drafts`, async () => {
    const account = await createAccount();
    const leadId = await seedProfiledLead(account.organizationId);
    await Promise.all(
      Array.from({ length: MAX_SKIPPED_DRAFTS_PER_LEAD }, () =>
        seedMessage(account.organizationId, leadId, "skipped", "too_generic")
      )
    );
    expect(await leadsNeedingCopy(account.organizationId)).toEqual([]);
  });

  it("does not redraft a snoozed lead", async () => {
    const account = await createAccount();
    const leadId = await seedProfiledLead(account.organizationId, "snoozed");
    await seedMessage(account.organizationId, leadId, "skipped", "not_now");
    expect(await leadsNeedingCopy(account.organizationId)).toEqual([]);
  });

  it("hands the copywriter only the drafts rejected for their wording", async () => {
    const account = await createAccount();
    const leadId = await seedProfiledLead(account.organizationId);
    await seedMessage(account.organizationId, leadId, "skipped", "too_generic");
    await seedMessage(account.organizationId, leadId, "skipped", "lead_replied");
    const rejected = await repository.getRejectedDraftsForLead(leadId);
    expect(rejected.map((draft) => draft.skip_reason)).toEqual(["too_generic"]);
  });
});

describe("chasseur: contact selection", () => {
  it("drops mailboxes that never reach a decision-maker", () => {
    expect(isIrrelevantMailbox("objetsperdus@thepeacocksociety.fr")).toBe(true);
    expect(isIrrelevantMailbox("objets.perdus@venue.test")).toBe(true);
    expect(isIrrelevantMailbox("recrutement@venue.test")).toBe(true);
    expect(isIrrelevantMailbox("no-reply@venue.test")).toBe(true);
    expect(isIrrelevantMailbox("melanie@venue.test")).toBe(false);
    expect(isIrrelevantMailbox("contact@venue.test")).toBe(false);
  });

  it("recognizes shared inboxes", () => {
    expect(isSharedMailbox("contact@venue.test")).toBe(true);
    expect(isSharedMailbox("hello@venue.test")).toBe(true);
    expect(isSharedMailbox("jane.doe@venue.test")).toBe(false);
  });

  it("puts named people with their own email first, shared inboxes after", () => {
    const ranked = rankContacts([
      { firstName: null, lastName: null, email: "contact@venue.test" },
      { firstName: "Jane", lastName: null, email: null },
      { firstName: "Mélanie", lastName: "Noyer", email: "melanie@venue.test" },
      { firstName: "Paul", lastName: null, email: "info@venue.test" },
    ]);
    expect(ranked.map((contact) => contact.email ?? contact.firstName)).toEqual([
      "melanie@venue.test",
      "info@venue.test",
      "contact@venue.test",
      "Jane",
    ]);
  });
});
