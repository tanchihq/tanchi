const DEFAULT_FETCH_TIMEOUT_MS = 15000;
const USER_AGENT = "Mozilla/5.0 (compatible; SweeLeadsBot/1.0)";

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchPageText(
  url: string,
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS
): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": USER_AGENT },
      redirect: "follow",
    });
    if (!response.ok) return null;
    const html = await response.text();
    return htmlToText(html);
  } catch {
    return null;
  }
}

export function normalizeForMatch(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export function verifyQuote(pageText: string, quote: string): boolean {
  const normalizedQuote = normalizeForMatch(quote);
  if (normalizedQuote.length === 0) return false;
  return normalizeForMatch(pageText).includes(normalizedQuote);
}

export function hostOf(url: string): string | null {
  try {
    return new URL(url).host.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}
