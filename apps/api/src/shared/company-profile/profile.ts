import { llm } from "@shared/llm";
import { languageName } from "./languages.ts";
import {
  companySourceUrls,
  fetchCompanySourcePages,
  type CompanySourceInput,
} from "./pages.ts";

const PROFILE_MAX_TOKENS = 1500;

export type CompanyProfileInput = CompanySourceInput &
  Readonly<{
    marketName: string;
    country: string;
  }>;

function buildPrompt(
  input: CompanyProfileInput,
  pages: ReadonlyArray<string>
): string {
  return [
    "You are a B2B positioning analyst. Write a concise company profile that a sales copywriter can reuse.",
    "",
    `Company: ${input.companyName}`,
    `Website: ${input.website}`,
    `Target market: ${input.marketName} (${input.country})`,
    "",
    "Cover: what the company sells, its value proposition, who its ideal customers are, key differentiators, and the tone of voice. Ground everything in the pages below. Do not invent facts.",
    `Write the profile in ${languageName(input.outreachLanguage)}, whatever language the source pages are in.`,
    "Output plain text (no markdown headers), 150-300 words.",
    "",
    pages.length === 0
      ? "(no page content could be fetched — write a minimal profile from the company name and website only)"
      : `Source pages:\n${pages.join("\n\n")}`,
  ].join("\n");
}

export async function generateCompanyProfile(
  input: CompanyProfileInput
): Promise<string> {
  const pages = await fetchCompanySourcePages(
    companySourceUrls(input),
    input.outreachLanguage
  );
  const result = await llm.generate({
    prompt: buildPrompt(input, pages),
    maxTokens: PROFILE_MAX_TOKENS,
  });
  return result.trim();
}
