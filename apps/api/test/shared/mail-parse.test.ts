import { describe, expect, it } from "bun:test";
import {
  extractMessageIds,
  hasReplyPrefix,
  htmlToPlainText,
  normalizeSubject,
  parseDeliveryStatus,
  parseInboundEmail,
  replySubject,
  stripQuotedReply,
} from "../../src/shared/mail-parse/index.ts";

const crlf = (lines: ReadonlyArray<string>): string => lines.join("\r\n");

const OUTLOOK_FRENCH_REPLY = crlf([
  "From: =?UTF-8?Q?M=C3=A9lanie_Noyer?= <melanie@assogetup.com>",
  "To: =?UTF-8?Q?S=C3=A9bastien?= <sebastien@sweescape.com>",
  "Subject: =?UTF-8?Q?RE_:_Re_:_votre_billetterie,_sans_interm=C3=A9diaire?=",
  "Date: Wed, 23 Sep 2026 09:12:00 +0200",
  "Message-ID: <AM0PR01-reply-1@assogetup.com>",
  "In-Reply-To: <0199-follow-up@sweescape.com>",
  "References: <0199-first@sweescape.com> <0199-follow-up@sweescape.com>",
  "MIME-Version: 1.0",
  'Content-Type: multipart/alternative; boundary="ALT"',
  "",
  "--ALT",
  "Content-Type: text/plain; charset=utf-8",
  "Content-Transfer-Encoding: quoted-printable",
  "",
  "Bonjour,",
  "",
  "Nous sommes engag=C3=A9s avec Weezevent pour 3 ans soit jusqu=E2=80=99en 2028.",
  "Ce sujet n=E2=80=99est pas d=E2=80=99actualit=C3=A9 en effet pour nous.",
  "Merci",
  "",
  "De : S=C3=A9bastien Sweescape <sebastien@sweescape.com>",
  "Date : mardi, 22 septembre 2026 =C3=A0 17:15",
  "=C3=80 : M=C3=A9lanie Noyer <melanie@assogetup.com>",
  "Objet : Re : votre billetterie, sans interm=C3=A9diaire",
  "",
  "Je me permets un petit retour sur mon message de la semaine derni=C3=A8re.",
  "",
  "--ALT",
  "Content-Type: text/html; charset=utf-8",
  "",
  "<p>Bonjour,</p>",
  "",
  "--ALT--",
  "",
]);

const OVH_BOUNCE = crlf([
  "From: MAILER-DAEMON@mo583.mail-out.ovh.net (Mail Delivery System)",
  "To: sebastien@sweescape.com",
  "Subject: Undelivered Mail Returned to Sender",
  "Message-Id: <20260922151527.ABC@mo583.mail-out.ovh.net>",
  "Auto-Submitted: auto-replied",
  "MIME-Version: 1.0",
  'Content-Type: multipart/report; report-type=delivery-status; boundary="BOUND"',
  "",
  "--BOUND",
  "Content-Type: text/plain; charset=us-ascii",
  "",
  "This is the mail system at host mo583.mail-out.ovh.net.",
  "<objetsperdus@thepeacocksociety.fr>: host aspmx.l.google.com said: 550-5.1.1",
  "",
  "--BOUND",
  "Content-Type: message/delivery-status",
  "",
  "Reporting-MTA: dns; mo583.mail-out.ovh.net",
  "",
  "Final-Recipient: rfc822; objetsperdus@thepeacocksociety.fr",
  "Original-Recipient: rfc822;objetsperdus@thepeacocksociety.fr",
  "Action: failed",
  "Status: 5.1.1",
  "Diagnostic-Code: smtp; 550-5.1.1 The email account that you tried to reach",
  "    does not exist.",
  "",
  "--BOUND",
  "Content-Type: message/rfc822",
  "",
  "From: Sebastien <sebastien@sweescape.com>",
  "To: objetsperdus@thepeacocksociety.fr",
  "Subject: Re: billetterie sans commission",
  "Message-ID: <0199-peacock@sweescape.com>",
  "",
  "Bonjour,",
  "",
  "--BOUND--",
  "",
]);

const OUT_OF_OFFICE = crlf([
  "From: Jane Doe <jane@acme.test>",
  "To: sebastien@sweescape.com",
  "Subject: Automatic reply: Quick question",
  "Auto-Submitted: auto-replied",
  "Message-ID: <ooo-1@acme.test>",
  "Content-Type: text/plain; charset=utf-8",
  "",
  "I am out of the office until Monday.",
  "",
]);

const HTML_ONLY_BASE64 = crlf([
  "From: Paul <paul@globex.test>",
  "To: sebastien@sweescape.com",
  "Subject: Re: Quick question",
  "Message-ID: <html-1@globex.test>",
  "In-Reply-To: 0199-bare@sweescape.com",
  "Content-Type: text/html; charset=utf-8",
  "Content-Transfer-Encoding: base64",
  "",
  Buffer.from(
    "<div>Oui, avec plaisir&nbsp;!<br>Mardi 14h ?</div><blockquote>Ancien message</blockquote>"
  ).toString("base64"),
  "",
]);

describe("mail-parse: message ids", () => {
  it("extracts every bracketed id from In-Reply-To / References", () => {
    expect(extractMessageIds("<a@x.test> <b@y.test>")).toEqual([
      "<a@x.test>",
      "<b@y.test>",
    ]);
  });

  it("wraps a bare id in brackets", () => {
    expect(extractMessageIds("abc@x.test")).toEqual(["<abc@x.test>"]);
  });

  it("returns nothing for an empty or missing header", () => {
    expect(extractMessageIds(undefined)).toEqual([]);
    expect(extractMessageIds("   ")).toEqual([]);
  });
});

describe("mail-parse: subjects", () => {
  it("normalizes stacked reply prefixes in several languages", () => {
    expect(normalizeSubject("RE : Re : votre billetterie")).toBe(
      "votre billetterie"
    );
    expect(normalizeSubject("TR: Fwd: AW: Hello  there")).toBe("hello there");
  });

  it("builds a single Re: subject for a follow-up", () => {
    expect(replySubject("Re : votre billetterie")).toBe(
      "Re: votre billetterie"
    );
    expect(replySubject("")).toBe("");
  });

  it("detects a reply prefix", () => {
    expect(hasReplyPrefix("Re: hello")).toBe(true);
    expect(hasReplyPrefix("Newsletter de septembre")).toBe(false);
  });
});

describe("mail-parse: quoted history", () => {
  it("cuts a French Outlook quote block", () => {
    const reply = stripQuotedReply(
      [
        "Ce sujet n'est pas d'actualité.",
        "",
        "De : Sébastien <sebastien@sweescape.com>",
        "Date : mardi 22 septembre 2026",
        "Objet : Re : billetterie",
        "",
        "Mon pitch",
      ].join("\n")
    );
    expect(reply).toBe("Ce sujet n'est pas d'actualité.");
  });

  it("cuts a Gmail 'On … wrote:' header even when wrapped on two lines", () => {
    const reply = stripQuotedReply(
      [
        "Sounds good, let's talk Tuesday.",
        "",
        "On Tue, Sep 22, 2026 at 5:15 PM Sebastien <sebastien@sweescape.com>",
        "wrote:",
        "> My pitch",
      ].join("\n")
    );
    expect(reply).toBe("Sounds good, let's talk Tuesday.");
  });

  it("keeps the whole text when nothing looks like a quote", () => {
    expect(stripQuotedReply("Just a plain answer.")).toBe("Just a plain answer.");
  });

  it("turns html into readable lines and drops blockquotes", () => {
    expect(
      htmlToPlainText("<p>Hello&nbsp;there</p><blockquote>old</blockquote><p>Bye</p>")
    ).toBe("Hello there\n\nBye");
  });
});

describe("mail-parse: delivery status", () => {
  it("keeps permanent failures only", () => {
    const failures = parseDeliveryStatus(
      [
        "Reporting-MTA: dns; mx.test",
        "",
        "Final-Recipient: rfc822; dead@acme.test",
        "Action: failed",
        "Status: 5.1.1",
        "",
        "Final-Recipient: rfc822; later@acme.test",
        "Action: delayed",
        "Status: 4.4.7",
      ].join("\n")
    );
    expect(failures).toEqual(["dead@acme.test"]);
  });
});

describe("mail-parse: parseInboundEmail", () => {
  it("decodes a quoted-printable Outlook reply and keeps only the new text", async () => {
    const email = await parseInboundEmail(OUTLOOK_FRENCH_REPLY);
    expect(email.fromEmail).toBe("melanie@assogetup.com");
    expect(email.fromName).toBe("Mélanie Noyer");
    expect(email.messageId).toBe("<AM0PR01-reply-1@assogetup.com>");
    expect(email.referencedMessageIds).toEqual([
      "<0199-follow-up@sweescape.com>",
      "<0199-first@sweescape.com>",
    ]);
    expect(email.text).toContain("Nous sommes engagés avec Weezevent");
    expect(email.text).not.toContain("Je me permets");
    expect(email.isAutoReply).toBe(false);
    expect(email.bounce).toBeNull();
  });

  it("reads a delivery status report as a bounce with the original message id", async () => {
    const email = await parseInboundEmail(OVH_BOUNCE);
    expect(email.bounce).toEqual({
      permanentFailures: ["objetsperdus@thepeacocksociety.fr"],
      originalMessageId: "<0199-peacock@sweescape.com>",
    });
    expect(email.isAutoReply).toBe(false);
  });

  it("flags an out-of-office reply as automatic", async () => {
    const email = await parseInboundEmail(OUT_OF_OFFICE);
    expect(email.isAutoReply).toBe(true);
    expect(email.bounce).toBeNull();
  });

  it("decodes a base64 html-only reply", async () => {
    const email = await parseInboundEmail(HTML_ONLY_BASE64);
    expect(email.text).toBe("Oui, avec plaisir !\nMardi 14h ?");
    expect(email.referencedMessageIds).toEqual(["<0199-bare@sweescape.com>"]);
  });
});
