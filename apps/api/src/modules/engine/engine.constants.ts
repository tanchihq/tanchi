export const COMPANIES_PER_ICP = 5;
export const MAX_LEADS_PER_COMPANY = 3;

export const CHASSEUR_LEARNING_WINDOW_DAYS = 120;
export const CHASSEUR_TOP_VALUES_PER_DIMENSION = 3;

export const HUNTER_MIN_CONFIDENCE = 50;

export const IRRELEVANT_MAILBOX_LOCAL_PARTS: ReadonlyArray<string> = [
  "objetsperdus",
  "objetperdu",
  "lostandfound",
  "lostfound",
  "jobs",
  "job",
  "careers",
  "career",
  "carriere",
  "carrieres",
  "recrutement",
  "recruitment",
  "recruiting",
  "candidature",
  "candidatures",
  "rh",
  "hr",
  "stage",
  "stages",
  "internship",
  "presse",
  "press",
  "media",
  "medias",
  "support",
  "sav",
  "help",
  "helpdesk",
  "assistance",
  "serviceclient",
  "customerservice",
  "billing",
  "invoice",
  "invoices",
  "facture",
  "factures",
  "facturation",
  "compta",
  "comptabilite",
  "accounting",
  "accounts",
  "noreply",
  "donotreply",
  "newsletter",
  "unsubscribe",
  "webmaster",
  "postmaster",
  "abuse",
  "privacy",
  "dpo",
  "rgpd",
  "gdpr",
  "legal",
  "juridique",
  "security",
];

export const SHARED_MAILBOX_LOCAL_PARTS: ReadonlyArray<string> = [
  "contact",
  "contacts",
  "info",
  "infos",
  "hello",
  "hi",
  "bonjour",
  "team",
  "equipe",
  "office",
  "admin",
  "mail",
  "general",
  "enquiries",
  "inquiries",
];

export const COPY_TEMPERATURE = 0.9;
export const EXPLORATION_RATE = 0.3;

export const PROFILER_FETCH_TIMEOUT_MS = 15000;

export const ENGINE_QUEUE_NAME = "engine-nightly";
export const ENGINE_NIGHTLY_CRON = "0 2 * * *";

export const ENGINE_RATE_LIMIT_WINDOW_SECONDS = 3600;
export const ENGINE_RUN_RATE_LIMIT = 20;
export const ANALYSTE_RATE_LIMIT = 10;

export const ANALYSTE_QUEUE_NAME = "engine-analyste";
export const ANALYSTE_WEEKLY_CRON = "0 4 * * 1";
export const ANALYSTE_WINDOW_DAYS = 90;
export const ANALYSTE_MAX_EXAMPLES = 6;
export const ANALYSTE_MAX_EDITS = 10;
export const ANALYSTE_MAX_REJECTIONS = 10;

export const MAX_SKIPPED_DRAFTS_PER_LEAD = 3;
export const ANALYSTE_PLAYBOOK_MAX_TOKENS = 1200;
export const ANALYSTE_TEMPERATURE = 0.4;
