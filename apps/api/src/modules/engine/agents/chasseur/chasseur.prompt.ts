import type { PgEngineIcp } from "../../repository/engine/engine.entities.ts";
import type { EngineOffer, MarketContext } from "../../engine.types.ts";
import type { DiscoveryOutput } from "./chasseur.schemas.ts";

type DiscoveredCompany = DiscoveryOutput["companies"][number];

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryLabel(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export function buildEnrichmentPrompt(
  company: DiscoveredCompany,
  domain: string,
  count: number,
  today: string
): string {
  return [
    "You are a B2B contact finder. You find REAL, currently-employed people at a company and their publicly-listed contact details.",
    "",
    `Today's date is ${today}.`,
    "",
    "Company:",
    `- Name: ${company.name}`,
    `- Domain: ${domain}`,
    company.sector === null ? "" : `- Sector: ${company.sector}`,
    "",
    "HARD RULES, non-negotiable:",
    "- Only include contact details you actually retrieved via the web (team/about page, LinkedIn, press, directories). WebFetch the real page; prefer it over snippets.",
    "- NEVER guess or construct an email from a name + domain pattern. Include an email ONLY if it literally appears on a page you fetched.",
    "- Same for linkedinUrl / instagramUrl / phone: include only if you actually found them on a real page. If not found, use null.",
    "- Every contact MUST carry a sourceUrl (the page where you found their details).",
    "- No invented people. Prefer decision-makers relevant to outreach (founders, heads of, directors).",
    "",
    `Find up to ${count} contacts. It's fine to return fewer, or none, if you can't verify anyone.`,
    "",
    "Respond with ONLY this JSON object, no surrounding text:",
    '{ "contacts": [ { "firstName": "... or null", "lastName": "... or null", "role": "... or null", "email": "... or null", "linkedinUrl": "... or null", "instagramUrl": "... or null", "phone": "... or null", "sourceUrl": "https://..." } ] }',
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function buildDiscoveryPrompt(
  icp: PgEngineIcp,
  offer: EngineOffer,
  market: MarketContext,
  count: number,
  today: string,
  winningProfile: string
): string {
  return [
    "You are a B2B prospect hunter. You identify REAL companies that match a target profile.",
    "",
    `Today's date is ${today}. When you weigh a company's recent news, funding or growth, anchor the notion of "recent" to this date.`,
    "",
    "Our client sells:",
    `- Company: ${offer.companyName}`,
    `- Website: ${offer.website}`,
    offer.productPageUrl === "" ? "" : `- Product: ${offer.productPageUrl}`,
    market.companyProfile === ""
      ? ""
      : `- Company profile: ${market.companyProfile}`,
    "",
    "Target profile (ICP) to match:",
    `- Name: ${icp.name}`,
    icp.archetype === null ? "" : `- Archetype: ${icp.archetype}`,
    `- Description: ${icp.description}`,
    icp.perceived_value === null
      ? ""
      : `- Perceived value: ${icp.perceived_value}`,
    "",
    `Target country: ${countryLabel(market.country)} — only find companies based in this country. Outreach will be written in ${market.outreachLanguage}.`,
    "",
    winningProfile === "" ? "" : winningProfile,
    `Find ${count} real, verifiable companies (via the web) that match this ICP and would be good prospects for this offer.`,
    "Do not invent any company. Each company must exist and have a real web domain.",
    "",
    "Respond with ONLY this JSON object, no surrounding text:",
    '{ "companies": [ { "name": "...", "domain": "example.com", "sector": "... or null", "size": "... or null", "hq": "... or null" } ] }',
  ]
    .filter((line) => line !== "")
    .join("\n");
}
