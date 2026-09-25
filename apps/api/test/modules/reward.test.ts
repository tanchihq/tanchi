import { beforeEach, describe, expect, it } from "bun:test";
import { createAccount } from "../helpers/client.ts";
import { db, truncateAll } from "../helpers/db.ts";
import { encryptSecret } from "../../src/shared/crypto/index.ts";
import type { InboundEmail } from "../../src/shared/mail-parse/index.ts";
import type { LlmProvider } from "../../src/shared/llm/types.ts";
import { RewardPostgres } from "../../src/modules/reward/repository/reward/reward.postgres.ts";
import { RewardRepository } from "../../src/modules/reward/repository/reward/reward.repository.ts";
import { RewardService } from "../../src/modules/reward/reward.service.ts";
import {
  nextStageAfterReply,
  shouldAdoptReplier,
  splitDisplayName,
} from "../../src/modules/reward/reward.utils.ts";

const fakeLlm = (answer: string): LlmProvider => ({
  research: () => Promise.resolve(""),
  generate: () => Promise.resolve(answer),
  stream: async function* () {},
  agent: async function* () {},
});

const serviceAnswering = (answer: string): RewardService =>
  new RewardService(new RewardRepository(new RewardPostgres(db)), fakeLlm(answer));

type LeadSeed = Readonly<{
  organizationId: string;
  email: string | null;
  stage?: string;
  firstName?: string | null;
  subject?: string;
  emailMessageId?: string | null;
  pendingDraft?: boolean;
}>;

type LeadSeeded = Readonly<{ leadId: string; sentMessageId: string }>;

const seedContactedLead = async (seed: LeadSeed): Promise<LeadSeeded> => {
  const leadId = Bun.randomUUIDv7();
  const sentMessageId = Bun.randomUUIDv7();
  await db`
    INSERT INTO leads (id, organization_id, first_name, email, channel, stage, sequence_step)
    VALUES (
      ${leadId}, ${seed.organizationId}, ${seed.firstName === undefined ? "Jane" : seed.firstName},
      ${seed.email}, 'email', ${seed.stage ?? "contacted"}, 1
    )
  `;
  await db`
    INSERT INTO messages (
      id, organization_id, lead_id, channel, subject, body, status, sent_at,
      email_message_id
    )
    VALUES (
      ${sentMessageId}, ${seed.organizationId}, ${leadId}, 'email',
      ${seed.subject ?? "votre billetterie, sans intermédiaire"}, 'Pitch', 'sent',
      NOW() - INTERVAL '2 days', ${seed.emailMessageId ?? null}
    )
  `;
  if (seed.pendingDraft === true) {
    await db`
      INSERT INTO messages (id, organization_id, lead_id, channel, subject, body, status)
      VALUES (
        ${Bun.randomUUIDv7()}, ${seed.organizationId}, ${leadId}, 'email',
        'Re: follow-up', 'Follow-up body', 'draft'
      )
    `;
  }
  return { leadId, sentMessageId };
};

const seedSender = async (organizationId: string, fromEmail: string): Promise<void> => {
  await db`
    INSERT INTO senders (
      id, organization_id, from_name, from_email, smtp_host, smtp_port,
      smtp_secure, imap_host, imap_port, imap_secure, username,
      secret_encrypted, status
    )
    VALUES (
      ${Bun.randomUUIDv7()}, ${organizationId}, 'Seb', ${fromEmail},
      'smtp.acme.test', 587, false, 'imap.acme.test', 993, true, ${fromEmail},
      ${encryptSecret("secret")}, 'active'
    )
  `;
};

const inbound = (overrides: Partial<InboundEmail>): InboundEmail => ({
  messageId: `<${Bun.randomUUIDv7()}@prospect.test>`,
  fromEmail: "someone@prospect.test",
  fromName: "",
  subject: "Re: votre billetterie, sans intermédiaire",
  text: "Merci pour votre message.",
  referencedMessageIds: [],
  receivedAt: new Date(),
  isAutoReply: false,
  bounce: null,
  ...overrides,
});

const leadRow = async (leadId: string) => {
  const rows = await db<
    ReadonlyArray<Readonly<{ stage: string; email: string | null; first_name: string | null }>>
  >`SELECT stage, email, first_name FROM leads WHERE id = ${leadId}`;
  return rows[0];
};

const replyOutcomes = async (leadId: string) => [
  ...(await db<
    ReadonlyArray<
      Readonly<{ classification: string; reply_from: string | null; message_id: string }>
    >
  >`
    SELECT classification, reply_from, message_id FROM outcomes
    WHERE lead_id = ${leadId} AND stage_signal = 'replied'
    ORDER BY created_at ASC
  `),
];

beforeEach(truncateAll);

describe("reward: matching a reply to the right lead", () => {
  it("matches a reply sent from another address through In-Reply-To (relayed contact@ mailbox)", async () => {
    const account = await createAccount();
    const seeded = await seedContactedLead({
      organizationId: account.organizationId,
      email: "contact@dubcampfestival.com",
      firstName: null,
      emailMessageId: "<0199-first@sweescape.com>",
    });
    const service = serviceAnswering("negative");
    const context = await service.buildContext(account.organizationId);

    const processed = await service.processInbound(
      context,
      inbound({
        fromEmail: "melanie@assogetup.com",
        fromName: "Mélanie Noyer",
        referencedMessageIds: ["<0199-first@sweescape.com>"],
        text: "Nous sommes engagés avec Weezevent jusqu'en 2028.",
      })
    );

    expect(processed).toBe(true);
    const outcomes = await replyOutcomes(seeded.leadId);
    expect(outcomes.length).toBe(1);
    expect(outcomes[0]?.message_id).toBe(seeded.sentMessageId);
    expect(outcomes[0]?.reply_from).toBe("Mélanie Noyer <melanie@assogetup.com>");
    const lead = await leadRow(seeded.leadId);
    expect(lead?.stage).toBe("not-interested");
    expect(lead?.email).toBe("melanie@assogetup.com");
    expect(lead?.first_name).toBe("Mélanie");
  });

  it("falls back on the subject for emails sent before message ids were stored", async () => {
    const account = await createAccount();
    const seeded = await seedContactedLead({
      organizationId: account.organizationId,
      email: "contact@festival.test",
      subject: "Re : votre billetterie, sans intermédiaire",
    });
    const service = serviceAnswering("positive");
    const context = await service.buildContext(account.organizationId);

    const processed = await service.processInbound(
      context,
      inbound({
        fromEmail: "boss@other-domain.test",
        subject: "RE : Re : votre billetterie, sans intermédiaire",
      })
    );

    expect(processed).toBe(true);
    expect((await leadRow(seeded.leadId))?.stage).toBe("meeting");
  });

  it("does not guess when a subject matches several leads", async () => {
    const account = await createAccount();
    await seedContactedLead({ organizationId: account.organizationId, email: "a@one.test", subject: "Quick question" });
    await seedContactedLead({ organizationId: account.organizationId, email: "b@two.test", subject: "Quick question" });
    const service = serviceAnswering("positive");
    const context = await service.buildContext(account.organizationId);

    const processed = await service.processInbound(
      context,
      inbound({ fromEmail: "x@three.test", subject: "Re: Quick question" })
    );
    expect(processed).toBe(false);
  });

  it("never matches a message id sent by another organization", async () => {
    const owner = await createAccount();
    const intruder = await createAccount();
    const seeded = await seedContactedLead({
      organizationId: owner.organizationId,
      email: "jane@prospect.test",
      emailMessageId: "<owner-only@sweescape.com>",
    });
    const service = serviceAnswering("positive");
    const context = await service.buildContext(intruder.organizationId);

    const processed = await service.processInbound(
      context,
      inbound({
        fromEmail: "jane@prospect.test",
        referencedMessageIds: ["<owner-only@sweescape.com>"],
      })
    );
    expect(processed).toBe(false);
    expect(await replyOutcomes(seeded.leadId)).toEqual([]);
  });

  it("ignores emails coming from the organization's own mailboxes", async () => {
    const account = await createAccount();
    await seedSender(account.organizationId, "sebastien@sweescape.com");
    await seedContactedLead({
      organizationId: account.organizationId,
      email: "jane@prospect.test",
      emailMessageId: "<own@sweescape.com>",
    });
    const service = serviceAnswering("positive");
    const context = await service.buildContext(account.organizationId);

    const processed = await service.processInbound(
      context,
      inbound({
        fromEmail: "sebastien@sweescape.com",
        referencedMessageIds: ["<own@sweescape.com>"],
      })
    );
    expect(processed).toBe(false);
  });
});

describe("reward: recording replies", () => {
  it("stores a neutral reply (it used to violate the classification constraint)", async () => {
    const account = await createAccount();
    const seeded = await seedContactedLead({
      organizationId: account.organizationId,
      email: "jane@prospect.test",
    });
    const service = serviceAnswering("neutral");
    const context = await service.buildContext(account.organizationId);

    expect(
      await service.processInbound(context, inbound({ fromEmail: "jane@prospect.test" }))
    ).toBe(true);
    expect((await replyOutcomes(seeded.leadId))[0]?.classification).toBe("neutral");
    expect((await leadRow(seeded.leadId))?.stage).toBe("replied");
  });

  it("takes a second reply into account (later, then positive)", async () => {
    const account = await createAccount();
    const seeded = await seedContactedLead({
      organizationId: account.organizationId,
      email: "jane@prospect.test",
    });

    const later = serviceAnswering("later");
    await later.processInbound(
      await later.buildContext(account.organizationId),
      inbound({ fromEmail: "jane@prospect.test", text: "Revenez vers moi en octobre." })
    );
    expect((await leadRow(seeded.leadId))?.stage).toBe("snoozed");

    const positive = serviceAnswering("positive");
    await positive.processInbound(
      await positive.buildContext(account.organizationId),
      inbound({ fromEmail: "jane@prospect.test", text: "Finalement, mardi 14h ?" })
    );
    expect((await leadRow(seeded.leadId))?.stage).toBe("meeting");
    expect((await replyOutcomes(seeded.leadId)).map((outcome) => outcome.classification)).toEqual([
      "later",
      "positive",
    ]);
  });

  it("processes the same reply only once across polls", async () => {
    const account = await createAccount();
    const seeded = await seedContactedLead({
      organizationId: account.organizationId,
      email: "jane@prospect.test",
    });
    const service = serviceAnswering("positive");
    const context = await service.buildContext(account.organizationId);
    const reply = inbound({ fromEmail: "jane@prospect.test" });

    expect(await service.processInbound(context, reply)).toBe(true);
    expect(await service.processInbound(context, reply)).toBe(false);
    expect((await replyOutcomes(seeded.leadId)).length).toBe(1);
  });

  it("ignores automatic replies such as out-of-office", async () => {
    const account = await createAccount();
    const seeded = await seedContactedLead({
      organizationId: account.organizationId,
      email: "jane@prospect.test",
    });
    const service = serviceAnswering("neutral");
    const context = await service.buildContext(account.organizationId);

    expect(
      await service.processInbound(
        context,
        inbound({ fromEmail: "jane@prospect.test", isAutoReply: true })
      )
    ).toBe(false);
    expect((await leadRow(seeded.leadId))?.stage).toBe("contacted");
  });

  it("skips the pending follow-up draft once the lead has replied", async () => {
    const account = await createAccount();
    const seeded = await seedContactedLead({
      organizationId: account.organizationId,
      email: "jane@prospect.test",
      pendingDraft: true,
    });
    const service = serviceAnswering("positive");
    await service.processInbound(
      await service.buildContext(account.organizationId),
      inbound({ fromEmail: "jane@prospect.test" })
    );

    const drafts = await db<ReadonlyArray<Readonly<{ status: string; skip_reason: string | null }>>>`
      SELECT status, skip_reason FROM messages
      WHERE lead_id = ${seeded.leadId} AND status <> 'sent'
    `;
    expect([...drafts]).toEqual([{ status: "skipped", skip_reason: "lead_replied" }]);
  });
});

describe("reward: bounces", () => {
  const bounceFor = (recipient: string, originalMessageId: string | null) =>
    inbound({
      fromEmail: "mailer-daemon@mo583.mail-out.ovh.net",
      subject: "Undelivered Mail Returned to Sender",
      bounce: { permanentFailures: [recipient], originalMessageId },
    });

  it("marks the lead as bounced, excludes the address and skips its drafts", async () => {
    const account = await createAccount();
    const seeded = await seedContactedLead({
      organizationId: account.organizationId,
      email: "objetsperdus@thepeacocksociety.fr",
      emailMessageId: "<0199-peacock@sweescape.com>",
      pendingDraft: true,
    });
    const service = serviceAnswering("neutral");

    const processed = await service.processInbound(
      await service.buildContext(account.organizationId),
      bounceFor("objetsperdus@thepeacocksociety.fr", "<0199-peacock@sweescape.com>")
    );

    expect(processed).toBe(true);
    expect((await leadRow(seeded.leadId))?.stage).toBe("bounced");
    const exclusions = await db<ReadonlyArray<Readonly<{ email: string; reason: string }>>>`
      SELECT email, reason FROM exclusions WHERE organization_id = ${account.organizationId}
    `;
    expect(exclusions.map((row) => row.email)).toEqual(["objetsperdus@thepeacocksociety.fr"]);
    const drafts = await db<ReadonlyArray<Readonly<{ skip_reason: string | null }>>>`
      SELECT skip_reason FROM messages WHERE lead_id = ${seeded.leadId} AND status = 'skipped'
    `;
    expect([...drafts]).toEqual([{ skip_reason: "address_bounced" }]);
    expect(await replyOutcomes(seeded.leadId)).toEqual([]);
  });

  it("matches a bounce by address when the original message id is unknown", async () => {
    const account = await createAccount();
    const seeded = await seedContactedLead({
      organizationId: account.organizationId,
      email: "Dead@Acme.test",
    });
    const service = serviceAnswering("neutral");
    await service.processInbound(
      await service.buildContext(account.organizationId),
      bounceFor("dead@acme.test", null)
    );
    expect((await leadRow(seeded.leadId))?.stage).toBe("bounced");
  });

  it("never downgrades a lead that already replied", async () => {
    const account = await createAccount();
    const seeded = await seedContactedLead({
      organizationId: account.organizationId,
      email: "jane@prospect.test",
      stage: "meeting",
    });
    const service = serviceAnswering("neutral");
    const processed = await service.processInbound(
      await service.buildContext(account.organizationId),
      bounceFor("jane@prospect.test", null)
    );
    expect(processed).toBe(false);
    expect((await leadRow(seeded.leadId))?.stage).toBe("meeting");
  });
});

describe("reward: pure rules", () => {
  it("moves the stage according to the classification without losing a meeting or a win", () => {
    expect(nextStageAfterReply("contacted", "positive")).toBe("meeting");
    expect(nextStageAfterReply("following-up", "negative")).toBe("not-interested");
    expect(nextStageAfterReply("contacted", "later")).toBe("snoozed");
    expect(nextStageAfterReply("meeting", "later")).toBe("meeting");
    expect(nextStageAfterReply("meeting", "neutral")).toBe("meeting");
    expect(nextStageAfterReply("won", "negative")).toBe("won");
  });

  it("adopts the replier only when the known address is a shared mailbox", () => {
    const lead = { id: "l", stage: "contacted", first_name: null, last_name: null };
    expect(shouldAdoptReplier({ ...lead, email: "contact@acme.test" }, "ceo@acme.test")).toBe(true);
    expect(shouldAdoptReplier({ ...lead, email: "jane@acme.test" }, "assistant@acme.test")).toBe(false);
    expect(shouldAdoptReplier({ ...lead, email: null }, "jane@acme.test")).toBe(true);
  });

  it("splits a display name into first and last name", () => {
    expect(splitDisplayName("Mélanie Noyer")).toEqual({ firstName: "Mélanie", lastName: "Noyer" });
    expect(splitDisplayName("")).toEqual({ firstName: null, lastName: null });
  });
});
