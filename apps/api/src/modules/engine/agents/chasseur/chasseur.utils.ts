import type { PgProfileConversionRow } from "../../repository/engine/engine.entities.ts";
import { CHASSEUR_TOP_VALUES_PER_DIMENSION } from "../../engine.constants.ts";

type AttrStat = Readonly<{
  value: string;
  sent: number;
  replied: number;
  positive: number;
}>;

function aggregateDimension(
  rows: ReadonlyArray<PgProfileConversionRow>,
  pick: (row: PgProfileConversionRow) => string | null
): ReadonlyArray<AttrStat> {
  const byValue = rows.reduce((acc, row) => {
    const value = pick(row);
    if (value === null || value === "") return acc;
    const current = acc.get(value) ?? {
      value,
      sent: 0,
      replied: 0,
      positive: 0,
    };
    return acc.set(value, {
      value,
      sent: current.sent + 1,
      replied: current.replied + (row.replied ? 1 : 0),
      positive: current.positive + (row.positive ? 1 : 0),
    });
  }, new Map<string, AttrStat>());
  return [...byValue.values()];
}

function topLine(
  title: string,
  stats: ReadonlyArray<AttrStat>,
  usePositive: boolean
): string {
  const scored = stats
    .filter((stat) => (usePositive ? stat.positive > 0 : stat.replied > 0))
    .sort((a, b) =>
      usePositive
        ? b.positive - a.positive || b.replied - a.replied
        : b.replied - a.replied || b.sent - a.sent
    )
    .slice(0, CHASSEUR_TOP_VALUES_PER_DIMENSION);
  if (scored.length === 0) return "";
  const parts = scored.map((stat) =>
    usePositive
      ? `${stat.value} (${stat.positive} positive)`
      : `${stat.value} (${stat.replied} replied)`
  );
  return `- ${title}: ${parts.join(", ")}`;
}

export function buildWinningProfileBrief(
  rows: ReadonlyArray<PgProfileConversionRow>
): string {
  if (rows.length === 0) return "";

  const hasPositive = rows.some((row) => row.positive);
  const hasReplied = rows.some((row) => row.replied);
  if (!hasPositive && !hasReplied) return "";

  const usePositive = hasPositive;
  const dimensions: ReadonlyArray<
    Readonly<{ title: string; pick: (row: PgProfileConversionRow) => string | null }>
  > = [
    { title: "Sectors", pick: (row) => row.sector },
    { title: "Company sizes", pick: (row) => row.size },
    { title: "Regions", pick: (row) => row.hq },
    { title: "Roles", pick: (row) => row.role },
    { title: "Qualification", pick: (row) => row.qualification },
  ];

  const lines = dimensions
    .map((dimension) =>
      topLine(dimension.title, aggregateDimension(rows, dimension.pick), usePositive)
    )
    .filter((line) => line !== "");
  if (lines.length === 0) return "";

  const header = usePositive
    ? `Winning prospect profile for this ICP, learned from ${rows.length} contacted prospect(s) (reward = positive reply / meeting):`
    : `Early signal for this ICP from ${rows.length} contacted prospect(s) — no positive reply yet, using replies (treat as weak):`;
  const footer = usePositive
    ? "Prioritize NEW companies whose profile matches these winning traits, without over-indexing on a single data point."
    : "Lean slightly toward these traits, but the signal is thin.";

  return [header, ...lines, footer].join("\n");
}
