import { llm } from "@shared/llm";
import { languageName } from "./languages.ts";
import {
  companySourceUrls,
  fetchCompanySourcePages,
  type CompanySourceInput,
} from "./pages.ts";

const ICPS_MAX_TOKENS = 3000;
const NAME_MAX_CHARS = 120;
const DESCRIPTION_MAX_CHARS = 2000;
const SHORT_FIELD_MAX_CHARS = 500;
const PROFILE_EXCERPT_MAX_CHARS = 4000;

export type IcpSuggestionInput = CompanySourceInput &
  Readonly<{
    companyProfile: string;
    marketName: string;
    country: string;
    count: number;
  }>;

export type IcpSuggestion = Readonly<{
  name: string;
  archetype: string;
  description: string;
  perceivedValue: string;
  angle: string;
  goldenRule: string;
}>;

function buildPrompt(
  input: IcpSuggestionInput,
  pages: ReadonlyArray<string>
): string {
  return [
    "You are a B2B go-to-market strategist. Propose the ideal customer profiles this company should prospect.",
    "",
    `Company: ${input.companyName}`,
    `Website: ${input.website}`,
    `Target market: ${input.marketName} (${input.country})`,
    "",
    input.companyProfile === ""
      ? ""
      : `Company profile:\n${input.companyProfile.slice(
          0,
          PROFILE_EXCERPT_MAX_CHARS
        )}\n`,
    pages.length === 0
      ? "(no page content could be fetched — rely on the company name, website and profile above)"
      : `Source pages:\n${pages.join("\n\n")}`,
    "",
    `Propose exactly ${input.count} distinct profiles that this company can realistically sell to in ${input.marketName}, ordered by how much revenue they are likely to bring.`,
    `Every profile must describe companies and buyers based in ${input.marketName}. Ignore segments that only exist in the company's other markets.`,
    "Ground every profile in the material above. Do not invent clients, logos or figures.",
    `The source pages may be in another language. Write every field in ${languageName(
      input.outreachLanguage
    )}, since that is the language the outreach will be written in.`,
    "",
    "For each profile fill:",
    '- "name": the segment, short and concrete (e.g. "Fintech scale-ups, 50-200 people")',
    '- "archetype": the person who signs, with their trigger (e.g. "VP Growth who just raised a Series A")',
    '- "description": who they are, their situation, what they struggle with, 2 to 4 sentences',
    '- "perceivedValue": what they get from this company, in their own words, 1 to 2 sentences',
    '- "angle": the entry angle that lands with them, one short phrase',
    '- "goldenRule": one do or one don\'t the writer must always respect for them, one short phrase',
    "",
    'Answer with JSON only, no prose, no code fence: {"icps":[{"name":"","archetype":"","description":"","perceivedValue":"","angle":"","goldenRule":""}]}',
  ].join("\n");
}

function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("[company-profile] no JSON object found in LLM output");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value.trim() : "";
}

function clamp(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max).trimEnd();
}

function toSuggestion(entry: unknown): IcpSuggestion | null {
  if (typeof entry !== "object" || entry === null) return null;
  const record = entry as Record<string, unknown>;
  const name = clamp(readString(record, "name"), NAME_MAX_CHARS);
  const description = clamp(
    readString(record, "description"),
    DESCRIPTION_MAX_CHARS
  );
  if (name === "" || description === "") return null;
  return {
    name,
    description,
    archetype: clamp(readString(record, "archetype"), SHORT_FIELD_MAX_CHARS),
    perceivedValue: clamp(
      readString(record, "perceivedValue"),
      SHORT_FIELD_MAX_CHARS
    ),
    angle: clamp(readString(record, "angle"), SHORT_FIELD_MAX_CHARS),
    goldenRule: clamp(readString(record, "goldenRule"), SHORT_FIELD_MAX_CHARS),
  };
}

function parseSuggestions(
  raw: string,
  count: number
): ReadonlyArray<IcpSuggestion> {
  const parsed = extractJsonObject(raw);
  if (typeof parsed !== "object" || parsed === null) return [];
  const icps = (parsed as Record<string, unknown>).icps;
  if (!Array.isArray(icps)) return [];
  return icps
    .map(toSuggestion)
    .filter((icp): icp is IcpSuggestion => icp !== null)
    .slice(0, count);
}

export async function generateIcpSuggestions(
  input: IcpSuggestionInput
): Promise<ReadonlyArray<IcpSuggestion>> {
  const pages = await fetchCompanySourcePages(
    companySourceUrls(input),
    input.outreachLanguage
  );
  const raw = await llm.generate({
    prompt: buildPrompt(input, pages),
    maxTokens: ICPS_MAX_TOKENS,
  });
  return parseSuggestions(raw, input.count);
}
