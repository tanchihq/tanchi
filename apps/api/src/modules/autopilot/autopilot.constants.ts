export const AUTOPILOT_QUEUE_NAME = "autopilot";
export const AUTOPILOT_CRON = "*/10 * * * *";

export const SEND_WINDOW_START_HOUR = 9;
export const SEND_WINDOW_END_HOUR = 17;

export const MIN_MINUTES_BETWEEN_SENDS = 8;
export const SEND_CLAIM_TTL_MINUTES = 10;
export const CANDIDATE_BATCH_LIMIT = 50;

export const BOUNCE_RATE_WINDOW_DAYS = 14;
export const BOUNCE_RATE_MIN_SENT = 20;
export const BOUNCE_RATE_PAUSE_THRESHOLD = 0.05;

export const DEFAULT_MARKET_TIMEZONE = "UTC";

export const MARKET_TIMEZONES: Readonly<Record<string, string>> = {
  AE: "Asia/Dubai",
  AR: "America/Argentina/Buenos_Aires",
  AT: "Europe/Vienna",
  AU: "Australia/Sydney",
  BE: "Europe/Brussels",
  BG: "Europe/Sofia",
  BR: "America/Sao_Paulo",
  CA: "America/Toronto",
  CH: "Europe/Zurich",
  CL: "America/Santiago",
  CN: "Asia/Shanghai",
  CO: "America/Bogota",
  CY: "Asia/Nicosia",
  CZ: "Europe/Prague",
  DE: "Europe/Berlin",
  DK: "Europe/Copenhagen",
  EE: "Europe/Tallinn",
  ES: "Europe/Madrid",
  FI: "Europe/Helsinki",
  FR: "Europe/Paris",
  GB: "Europe/London",
  GR: "Europe/Athens",
  HK: "Asia/Hong_Kong",
  HR: "Europe/Zagreb",
  HU: "Europe/Budapest",
  IE: "Europe/Dublin",
  IL: "Asia/Jerusalem",
  IN: "Asia/Kolkata",
  IT: "Europe/Rome",
  JP: "Asia/Tokyo",
  KR: "Asia/Seoul",
  LT: "Europe/Vilnius",
  LU: "Europe/Luxembourg",
  LV: "Europe/Riga",
  MA: "Africa/Casablanca",
  MC: "Europe/Monaco",
  MX: "America/Mexico_City",
  NL: "Europe/Amsterdam",
  NO: "Europe/Oslo",
  NZ: "Pacific/Auckland",
  PL: "Europe/Warsaw",
  PT: "Europe/Lisbon",
  RO: "Europe/Bucharest",
  SA: "Asia/Riyadh",
  SE: "Europe/Stockholm",
  SG: "Asia/Singapore",
  SI: "Europe/Ljubljana",
  SK: "Europe/Bratislava",
  SN: "Africa/Dakar",
  TN: "Africa/Tunis",
  TR: "Europe/Istanbul",
  UA: "Europe/Kyiv",
  US: "America/New_York",
  ZA: "Africa/Johannesburg",
};
