import { lookup } from "node:dns/promises";

const DEFAULT_FETCH_TIMEOUT_MS = 15000;
const MAX_REDIRECTS = 5;
const USER_AGENT = "Mozilla/5.0 (compatible; TanchiBot/1.0)";

const PRIVATE_IPV4_RANGES: ReadonlyArray<readonly [string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

function ipv4ToLong(ip: string): number | null {
  const octets = ip.split(".").map((part) => Number(part));
  if (
    octets.length !== 4 ||
    octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)
  ) {
    return null;
  }
  return octets.reduce((acc, n) => acc * 256 + n, 0);
}

function isPrivateIpv4(ip: string): boolean {
  const long = ipv4ToLong(ip);
  if (long === null) return true;
  return PRIVATE_IPV4_RANGES.some(([base, bits]) => {
    const baseLong = ipv4ToLong(base) ?? 0;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return ((long & mask) >>> 0) === ((baseLong & mask) >>> 0);
  });
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = (ip.split("%")[0] ?? ip).toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped !== null && mapped[1] !== undefined) return isPrivateIpv4(mapped[1]);
  return ["fc", "fd", "fe8", "fe9", "fea", "feb"].some((prefix) =>
    normalized.startsWith(prefix)
  );
}

async function isSafePublicUrl(url: string): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  try {
    const records = await lookup(parsed.hostname, { all: true });
    return (
      records.length > 0 &&
      records.every((record) =>
        record.family === 4
          ? !isPrivateIpv4(record.address)
          : !isPrivateIpv6(record.address)
      )
    );
  } catch {
    return false;
  }
}

async function fetchGuarded(
  url: string,
  timeoutMs: number,
  remainingRedirects: number
): Promise<Response | null> {
  if (!(await isSafePublicUrl(url))) return null;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "user-agent": USER_AGENT },
    redirect: "manual",
  });
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (location === null || remainingRedirects === 0) return null;
    return fetchGuarded(
      new URL(location, url).toString(),
      timeoutMs,
      remainingRedirects - 1
    );
  }
  return response;
}

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
    const response = await fetchGuarded(url, timeoutMs, MAX_REDIRECTS);
    if (response === null || !response.ok) return null;
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
