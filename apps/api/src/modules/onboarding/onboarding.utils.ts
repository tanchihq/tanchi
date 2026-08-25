import { SUPPORTED_OUTREACH_LANGUAGES } from "@shared/company-profile";
import {
  DEFAULT_COUNTRY,
  DEFAULT_MARKET_NAME,
  DEFAULT_OUTREACH_LANGUAGE,
  ORG_SLUG_BASE_MAX_LENGTH,
  ORG_SLUG_RANDOM_SUFFIX_LENGTH,
} from "./onboarding.constants.ts";
import type * as ResponseDto from "./dto/response/index.ts";

export function buildOrgSlug(company: string): string {
  const base = company
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, ORG_SLUG_BASE_MAX_LENGTH)
    .replace(/-+$/g, "");
  const randomSuffix = Bun.randomUUIDv7()
    .replace(/-/g, "")
    .slice(0, ORG_SLUG_RANDOM_SUFFIX_LENGTH);
  return base.length > 0 ? `${base}-${randomSuffix}` : randomSuffix;
}

export function convertToSignedUpDto(
  user: ResponseDto.SignedUpUserDto,
  organization: ResponseDto.SignedUpOrganizationDto
): ResponseDto.SignedUpDto {
  return { user, organization };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeDraftIcp(value: unknown): ResponseDto.OnboardingDraftIcpDto {
  const record = isRecord(value) ? value : {};
  return {
    name: asString(record.name),
    archetype: asString(record.archetype),
    description: asString(record.description),
    perceivedValue: asString(record.perceivedValue),
    angle: asString(record.angle),
    goldenRule: asString(record.goldenRule),
  };
}

function normalizeDraftMarket(
  value: unknown
): ResponseDto.OnboardingDraftMarketDto {
  const record = isRecord(value) ? value : {};
  const name = asString(record.name);
  const country = asString(record.country).toUpperCase();
  const outreachLanguage = asString(record.outreachLanguage);
  return {
    name: name === "" ? DEFAULT_MARKET_NAME : name,
    country: country === "" ? DEFAULT_COUNTRY : country,
    outreachLanguage: SUPPORTED_OUTREACH_LANGUAGES.includes(outreachLanguage)
      ? outreachLanguage
      : DEFAULT_OUTREACH_LANGUAGE,
  };
}

export function normalizeDraft(value: unknown): ResponseDto.OnboardingDraftDto {
  const record = isRecord(value) ? value : {};
  const icps = record.icps;
  return {
    market: normalizeDraftMarket(record.market),
    companyName: asString(record.companyName),
    website: asString(record.website),
    productPageUrl: asString(record.productPageUrl),
    salesDeckUrl: asString(record.salesDeckUrl),
    icps: Array.isArray(icps) ? icps.map(normalizeDraftIcp) : [],
  };
}

export function buildInitialDraft(
  companyName: string
): ResponseDto.OnboardingDraftDto {
  return normalizeDraft({ companyName });
}
