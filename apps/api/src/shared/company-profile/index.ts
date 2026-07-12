import { llm } from "@shared/llm";
import { fetchPageText } from "@shared/web";

const PAGE_TEXT_MAX_CHARS = 6000;
const PROFILE_MAX_TOKENS = 1500;

export type CompanyProfileInput = Readonly<{
  companyName: string;
  website: string;
  productPageUrl: string;
  salesDeckUrl: string;
}>;

async function fetchPages(
  urls: ReadonlyArray<string>
): Promise<ReadonlyArray<string>> {
  const nonEmpty = urls.filter((url) => url !== "");
  const texts = await Promise.all(
    nonEmpty.map(async (url) => {
      const text = await fetchPageText(url);
      return text === null ? "" : `[${url}]\n${text.slice(0, PAGE_TEXT_MAX_CHARS)}`;
    })
  );
  return texts.filter((text) => text !== "");
}

function buildPrompt(
  input: CompanyProfileInput,
  pages: ReadonlyArray<string>
): string {
  return [
    "You are a B2B positioning analyst. Write a concise company profile that a sales copywriter can reuse.",
    "",
    `Company: ${input.companyName}`,
    `Website: ${input.website}`,
    "",
    "Cover: what the company sells, its value proposition, who its ideal customers are, key differentiators, and the tone of voice. Ground everything in the pages below. Do not invent facts.",
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
  const pages = await fetchPages([
    input.website,
    input.productPageUrl,
    input.salesDeckUrl,
  ]);
  const result = await llm.generate({
    prompt: buildPrompt(input, pages),
    maxTokens: PROFILE_MAX_TOKENS,
  });
  return result.trim();
}
