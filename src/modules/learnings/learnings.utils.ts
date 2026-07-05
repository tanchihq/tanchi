import type { PgIcpLearning } from "./repository/learnings/learnings.entities.ts";
import type * as ResponseDto from "./dto/response/index.ts";

function splitPoints(content: string | null): ReadonlyArray<string> {
  if (content === null) return [];
  return content
    .split("\n")
    .map((line) => line.replace(/^[-*•\s]+/, "").trim())
    .filter((line) => line.length > 0);
}

export function convertPgIcpLearningToLearningDto(
  learning: PgIcpLearning
): ResponseDto.LearningDto {
  return {
    icp: learning.icp_name,
    points: splitPoints(learning.content),
    stat: "",
  };
}
