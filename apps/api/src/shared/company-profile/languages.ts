const LANGUAGE_NAMES: Readonly<Record<string, string>> = {
  en: "English",
  fr: "French",
  es: "Spanish",
  de: "German",
  it: "Italian",
  nl: "Dutch",
  pt: "Portuguese",
};

export const SUPPORTED_OUTREACH_LANGUAGES: ReadonlyArray<string> =
  Object.keys(LANGUAGE_NAMES);

export function languageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? "English";
}
