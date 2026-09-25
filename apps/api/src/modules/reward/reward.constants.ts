export const REPLY_POLL_SINCE_MINUTES = 2 * 24 * 60;
export const REWARD_POLL_CRON = "*/15 * * * *";
export const CLASSIFY_MAX_TOKENS = 10;

export const AUTOMATED_LOCAL_PARTS = [
  "postmaster",
  "mailer-daemon",
  "no-reply",
  "noreply",
  "do-not-reply",
  "donotreply",
  "bounce",
  "bounces",
  "abuse",
] as const;

export const PUBLIC_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "outlook.fr",
  "hotmail.com",
  "hotmail.fr",
  "live.com",
  "live.fr",
  "yahoo.com",
  "yahoo.fr",
  "icloud.com",
  "me.com",
  "orange.fr",
  "wanadoo.fr",
  "free.fr",
  "sfr.fr",
  "laposte.net",
  "protonmail.com",
  "proton.me",
] as const;

export const SUBJECT_MATCH_WINDOW_DAYS = 60;

export const BOUNCE_EXCLUSION_REASON = "Email address does not exist (bounced)";

export const BOUNCE_PROTECTED_STAGES: ReadonlyArray<string> = [
  "replied",
  "meeting",
  "won",
  "bounced",
];

export const GENERIC_MAILBOX_LOCAL_PARTS: ReadonlyArray<string> = [
  "contact",
  "contacts",
  "info",
  "infos",
  "information",
  "hello",
  "hi",
  "hey",
  "bonjour",
  "salut",
  "team",
  "equipe",
  "office",
  "admin",
  "mail",
  "email",
  "general",
  "enquiries",
  "inquiries",
  "sales",
  "booking",
  "bookings",
  "reservation",
  "reservations",
  "events",
  "event",
  "communication",
  "marketing",
];
