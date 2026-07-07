import type { PgSuppressionEntry } from "./repository/suppression/suppression.entities.ts";
import type * as ResponseDto from "./dto/response/index.ts";

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function extractEmails(text: string): ReadonlyArray<string> {
  const matches = text.match(EMAIL_PATTERN) ?? [];
  return [...new Set(matches.map((email) => email.toLowerCase()))];
}

export function convertPgSuppressionToDto(
  entry: PgSuppressionEntry
): ResponseDto.SuppressionEntryDto {
  return {
    email: entry.email,
    createdAt: entry.created_at.toISOString(),
  };
}
