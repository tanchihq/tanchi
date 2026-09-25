import { beforeEach, describe, expect, it } from "bun:test";
import { authedRequest, createAccount, jsonRequest, request } from "../helpers/client.ts";
import { db, truncateAll } from "../helpers/db.ts";
import { encryptSecret } from "../../src/shared/crypto/index.ts";
import { AutopilotPostgres } from "../../src/modules/autopilot/repository/autopilot/autopilot.postgres.ts";
import { AutopilotRepository } from "../../src/modules/autopilot/repository/autopilot/autopilot.repository.ts";
import { AutopilotService } from "../../src/modules/autopilot/autopilot.service.ts";
import {
  isWithinSendWindow,
  marketTimezone,
} from "../../src/modules/autopilot/autopilot.utils.ts";

const WEDNESDAY_10H_PARIS = new Date("2026-09-23T08:00:00.000Z");
const WEDNESDAY_22H_PARIS = new Date("2026-09-23T20:00:00.000Z");
const SATURDAY_10H_PARIS = new Date("2026-09-26T08:00:00.000Z");

const service = new AutopilotService(new AutopilotRepository(new AutopilotPostgres(db)));

const seedProfile = async (organizationId: string, enabled: boolean): Promise<void> => {
  await db`
    INSERT INTO organization_profile (organization_id, website, autopilot_enabled)
    VALUES (${organizationId}, 'https://acme.test', ${enabled})
  `;
};

const seedFrenchIcp = async (organizationId: string, name = "Festivals"): Promise<string> => {
  const marketId = Bun.randomUUIDv7();
  const icpId = Bun.randomUUIDv7();
  await db`
    INSERT INTO market (id, organization_id, name, position, country, outreach_language)
    VALUES (${marketId}, ${organizationId}, 'France', 0, 'FR', 'fr')
  `;
  await db`
    INSERT INTO icp (id, organization_id, name, description, position, market_id)
    VALUES (${icpId}, ${organizationId}, ${name}, 'Music festivals', 0, ${marketId})
  `;
  return icpId;
};

const seedSender = async (
  organizationId: string,
  fromEmail: string,
  dailyCap = 30
): Promise<string> => {
  const id = Bun.randomUUIDv7();
  await db`
    INSERT INTO senders (
      id, organization_id, from_name, from_email, smtp_host, smtp_port,
      smtp_secure, imap_host, imap_port, imap_secure, username,
      secret_encrypted, status, daily_cap
    )
    VALUES (
      ${id}, ${organizationId}, 'Seb', ${fromEmail}, 'smtp.acme.test', 587,
      false, 'imap.acme.test', 993, true, ${fromEmail},
      ${encryptSecret("secret")}, 'active', ${dailyCap}
    )
  `;
  return id;
};

type DraftSeed = Readonly<{
  organizationId: string;
  icpId: string | null;
  email: string;
  score?: number;
  stage?: string;
  channel?: string;
}>;

type DraftSeeded = Readonly<{ leadId: string; messageId: string }>;

const seedDraft = async (seed: DraftSeed): Promise<DraftSeeded> => {
  const leadId = Bun.randomUUIDv7();
  const messageId = Bun.randomUUIDv7();
  await db`
    INSERT INTO leads (id, organization_id, icp_id, email, channel, stage, score)
    VALUES (
      ${leadId}, ${seed.organizationId}, ${seed.icpId}, ${seed.email},
      ${seed.channel ?? "email"}, ${seed.stage ?? "identified"}, ${seed.score ?? null}
    )
  `;
  await db`
    INSERT INTO messages (id, organization_id, lead_id, icp_id, channel, subject, body, status)
    VALUES (
      ${messageId}, ${seed.organizationId}, ${leadId}, ${seed.icpId},
      ${seed.channel ?? "email"}, 'Hello', 'Draft body', 'draft'
    )
  `;
  return { leadId, messageId };
};

const seedPreviousSend = async (
  organizationId: string,
  leadId: string,
  senderId: string,
  sentAgo = "4 days"
): Promise<void> => {
  await db`
    INSERT INTO messages (
      id, organization_id, lead_id, channel, subject, body, status, sent_at,
      sender_id, email_message_id
    )
    VALUES (
      ${Bun.randomUUIDv7()}, ${organizationId}, ${leadId}, 'email', 'Hello',
      'First', 'sent', NOW() - ${sentAgo}::interval, ${senderId},
      ${`<${Bun.randomUUIDv7()}@acme.test>`}
    )
  `;
  await db`UPDATE leads SET sequence_step = 1, stage = 'following-up' WHERE id = ${leadId}`;
};

const messageRow = async (messageId: string) => {
  const rows = await db<
    ReadonlyArray<
      Readonly<{
        status: string;
        sent_automatically: boolean;
        email_message_id: string | null;
        sender_id: string | null;
      }>
    >
  >`
    SELECT status, sent_automatically, email_message_id, sender_id
    FROM messages WHERE id = ${messageId}
  `;
  return rows[0];
};

beforeEach(truncateAll);

describe("autopilot: status and toggle", () => {
  it("is off by default and warns about ICPs without a playbook", async () => {
    const account = await createAccount();
    await seedProfile(account.organizationId, false);
    const icpId = await seedFrenchIcp(account.organizationId);
    await seedDraft({ organizationId: account.organizationId, icpId, email: "jane@festival.test" });

    const res = await authedRequest("/api/v1/autopilot", account.cookie);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.enabled).toBe(false);
    expect(body.icpsWithoutPlaybook).toEqual(["Festivals"]);
    expect(body.hasActiveSender).toBe(false);
    expect(body.queuedEmails).toBe(1);
    expect(body.sendWindow).toEqual({ startHour: 9, endHour: 17 });
  });

  it("stops warning once the ICP has a playbook", async () => {
    const account = await createAccount();
    await seedProfile(account.organizationId, false);
    const icpId = await seedFrenchIcp(account.organizationId);
    await db`
      INSERT INTO playbook (id, organization_id, icp_id, content, generated_at)
      VALUES (${Bun.randomUUIDv7()}, ${account.organizationId}, ${icpId}, 'Lead with the venue.', NOW())
    `;
    const body = await (await authedRequest("/api/v1/autopilot", account.cookie)).json();
    expect(body.icpsWithoutPlaybook).toEqual([]);
  });

  it("switches autopilot on and off", async () => {
    const account = await createAccount();
    await seedProfile(account.organizationId, false);

    const on = await jsonRequest("/api/v1/autopilot", account.cookie, "PUT", { enabled: true });
    expect(on.status).toBe(200);
    const onBody = await on.json();
    expect(onBody.enabled).toBe(true);
    expect(onBody.updatedAt).toBeString();

    const off = await jsonRequest("/api/v1/autopilot", account.cookie, "PUT", { enabled: false });
    expect((await off.json()).enabled).toBe(false);
  });

  it("refuses to switch on before onboarding (409 notOnboarded)", async () => {
    const account = await createAccount();
    const res = await jsonRequest("/api/v1/autopilot", account.cookie, "PUT", { enabled: true });
    expect(res.status).toBe(409);
    expect((await res.json()).message).toBe("notOnboarded");
  });

  it("rejects a non-boolean value (400 invalidEnabled)", async () => {
    const account = await createAccount();
    await seedProfile(account.organizationId, false);
    const res = await jsonRequest("/api/v1/autopilot", account.cookie, "PUT", { enabled: "yes" });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidEnabled");
  });

  it("only changes the caller's organization", async () => {
    const owner = await createAccount();
    const other = await createAccount();
    await seedProfile(owner.organizationId, false);
    await seedProfile(other.organizationId, false);

    await jsonRequest("/api/v1/autopilot", other.cookie, "PUT", { enabled: true });
    const ownerBody = await (await authedRequest("/api/v1/autopilot", owner.cookie)).json();
    expect(ownerBody.enabled).toBe(false);
  });

  it("requires authentication", async () => {
    expect((await request("/api/v1/autopilot")).status).toBe(401);
  });
});

describe("autopilot: automatic sending", () => {
  it("sends nothing while autopilot is off", async () => {
    const account = await createAccount();
    await seedProfile(account.organizationId, false);
    const icpId = await seedFrenchIcp(account.organizationId);
    await seedSender(account.organizationId, "seb@acme.test");
    const draft = await seedDraft({ organizationId: account.organizationId, icpId, email: "jane@festival.test" });

    expect(await service.runOrganization(account.organizationId, WEDNESDAY_10H_PARIS)).toBe(0);
    expect((await messageRow(draft.messageId))?.status).toBe("draft");
  });

  it("sends the best draft during business hours and marks it as automatic", async () => {
    const account = await createAccount();
    await seedProfile(account.organizationId, true);
    const icpId = await seedFrenchIcp(account.organizationId);
    await seedSender(account.organizationId, "seb@acme.test");
    const low = await seedDraft({ organizationId: account.organizationId, icpId, email: "low@festival.test", score: 20 });
    const high = await seedDraft({ organizationId: account.organizationId, icpId, email: "high@festival.test", score: 90 });

    expect(await service.runOrganization(account.organizationId, WEDNESDAY_10H_PARIS)).toBe(1);

    const sent = await messageRow(high.messageId);
    expect(sent?.status).toBe("sent");
    expect(sent?.sent_automatically).toBe(true);
    expect(sent?.email_message_id).toBe("mock-message-id");
    expect((await messageRow(low.messageId))?.status).toBe("draft");
    const leads = await db<ReadonlyArray<Readonly<{ stage: string; origin: string }>>>`
      SELECT stage, origin FROM leads WHERE id = ${high.leadId}
    `;
    expect(leads[0]).toEqual({ stage: "contacted", origin: "auto" });
    const activity = await db<ReadonlyArray<Readonly<{ title: string }>>>`
      SELECT title FROM activity WHERE organization_id = ${account.organizationId} AND type = 'sent'
    `;
    expect(activity.map((row) => row.title)).toEqual([
      "Email sent automatically to high@festival.test",
    ]);
  });

  it("waits outside business hours and on excluded weekdays", async () => {
    const account = await createAccount();
    await seedProfile(account.organizationId, true);
    const icpId = await seedFrenchIcp(account.organizationId);
    await seedSender(account.organizationId, "seb@acme.test");
    await seedDraft({ organizationId: account.organizationId, icpId, email: "jane@festival.test" });

    expect(await service.runOrganization(account.organizationId, WEDNESDAY_22H_PARIS)).toBe(0);
    expect(await service.runOrganization(account.organizationId, SATURDAY_10H_PARIS)).toBe(0);
  });

  it("respects the mailbox daily cap", async () => {
    const account = await createAccount();
    await seedProfile(account.organizationId, true);
    const icpId = await seedFrenchIcp(account.organizationId);
    const senderId = await seedSender(account.organizationId, "seb@acme.test", 1);
    const earlier = await seedDraft({ organizationId: account.organizationId, icpId, email: "earlier@festival.test" });
    await seedPreviousSend(account.organizationId, earlier.leadId, senderId, "2 hours");
    await db`UPDATE messages SET status = 'skipped' WHERE id = ${earlier.messageId}`;
    const draft = await seedDraft({ organizationId: account.organizationId, icpId, email: "jane@festival.test" });

    expect(await service.runOrganization(account.organizationId, WEDNESDAY_10H_PARIS)).toBe(0);
    expect((await messageRow(draft.messageId))?.status).toBe("draft");
  });

  it("never sends to an excluded address or a non-email channel", async () => {
    const account = await createAccount();
    await seedProfile(account.organizationId, true);
    const icpId = await seedFrenchIcp(account.organizationId);
    await seedSender(account.organizationId, "seb@acme.test");
    const excluded = await seedDraft({ organizationId: account.organizationId, icpId, email: "Blocked@festival.test" });
    await db`
      INSERT INTO exclusions (id, organization_id, scope, email)
      VALUES (${Bun.randomUUIDv7()}, ${account.organizationId}, 'person', 'blocked@festival.test')
    `;
    const linkedin = await seedDraft({
      organizationId: account.organizationId,
      icpId,
      email: "jane@festival.test",
      channel: "linkedin",
    });

    expect(await service.runOrganization(account.organizationId, WEDNESDAY_10H_PARIS)).toBe(0);
    expect((await messageRow(excluded.messageId))?.status).toBe("draft");
    expect((await messageRow(linkedin.messageId))?.status).toBe("draft");
  });

  it("sends a follow-up from the mailbox that sent the first email", async () => {
    const account = await createAccount();
    await seedProfile(account.organizationId, true);
    const icpId = await seedFrenchIcp(account.organizationId);
    await seedSender(account.organizationId, "first@acme.test");
    const secondSender = await seedSender(account.organizationId, "second@acme.test");
    const followUp = await seedDraft({ organizationId: account.organizationId, icpId, email: "jane@festival.test" });
    await seedPreviousSend(account.organizationId, followUp.leadId, secondSender);

    expect(await service.runOrganization(account.organizationId, WEDNESDAY_10H_PARIS)).toBe(1);
    expect((await messageRow(followUp.messageId))?.sender_id).toBe(secondSender);
  });

  it("pauses a mailbox whose recent bounce rate is too high", async () => {
    const account = await createAccount();
    await seedProfile(account.organizationId, true);
    const icpId = await seedFrenchIcp(account.organizationId);
    const senderId = await seedSender(account.organizationId, "seb@acme.test");
    const history = await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        seedDraft({ organizationId: account.organizationId, icpId, email: `past-${index}@festival.test` })
      )
    );
    await Promise.all(
      history.map((seeded) => seedPreviousSend(account.organizationId, seeded.leadId, senderId, "3 days"))
    );
    await db`UPDATE messages SET status = 'skipped' WHERE status = 'draft'`;
    const bounced = history[0];
    if (bounced !== undefined) {
      await db`UPDATE leads SET stage = 'bounced' WHERE id = ${bounced.leadId}`;
    }
    const draft = await seedDraft({ organizationId: account.organizationId, icpId, email: "fresh@festival.test" });

    expect(await service.runOrganization(account.organizationId, WEDNESDAY_10H_PARIS)).toBe(0);
    expect((await messageRow(draft.messageId))?.status).toBe("draft");
    const status = await (await authedRequest("/api/v1/autopilot", account.cookie)).json();
    expect(status.senders[0].pausedForBounces).toBe(true);
  });
});

describe("autopilot: send window", () => {
  it("reads business hours in the market's timezone", () => {
    expect(isWithinSendWindow(WEDNESDAY_10H_PARIS, marketTimezone("FR"), [0, 6])).toBe(true);
    expect(isWithinSendWindow(WEDNESDAY_10H_PARIS, marketTimezone("US"), [0, 6])).toBe(false);
    expect(isWithinSendWindow(SATURDAY_10H_PARIS, marketTimezone("FR"), [0, 6])).toBe(false);
    expect(isWithinSendWindow(SATURDAY_10H_PARIS, marketTimezone("FR"), [])).toBe(true);
  });

  it("falls back to UTC for an unknown country", () => {
    expect(marketTimezone("ZZ")).toBe("UTC");
  });
});
