import type { PgExclusionEntry } from "./repository/suppression/suppression.entities.ts";
import type * as ResponseDto from "./dto/response/index.ts";

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function extractEmails(text: string): ReadonlyArray<string> {
  const matches = text.match(EMAIL_PATTERN) ?? [];
  return [...new Set(matches.map((email) => email.toLowerCase()))];
}

export function convertPgExclusionToDto(
  entry: PgExclusionEntry
): ResponseDto.ExclusionEntryDto {
  return {
    id: entry.id,
    scope: entry.scope,
    email: entry.email,
    companyDomain: entry.company_domain,
    reason: entry.reason,
    createdAt: entry.created_at.toISOString(),
  };
}
