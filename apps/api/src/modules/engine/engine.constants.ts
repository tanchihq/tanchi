export const COMPANIES_PER_ICP = 5;
export const MAX_LEADS_PER_COMPANY = 3;

export const CHASSEUR_LEARNING_WINDOW_DAYS = 120;
export const CHASSEUR_TOP_VALUES_PER_DIMENSION = 3;

export const HUNTER_MIN_CONFIDENCE = 50;

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
export const ANALYSTE_PLAYBOOK_MAX_TOKENS = 1200;
export const ANALYSTE_TEMPERATURE = 0.4;
