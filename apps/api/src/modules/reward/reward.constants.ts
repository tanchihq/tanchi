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
