export function addBusinessDays(
  from: Date,
  days: number,
  excludedWeekdays: ReadonlyArray<number>
): Date {
  const result = new Date(from.getTime());
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (!excludedWeekdays.includes(result.getDay())) {
      added += 1;
    }
  }
  return result;
}

export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("[sequences] no JSON object found in LLM output");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

export function lengthBucket(body: string): string {
  const length = body.length;
  if (length < 400) return "short";
  if (length < 900) return "medium";
  return "long";
}
