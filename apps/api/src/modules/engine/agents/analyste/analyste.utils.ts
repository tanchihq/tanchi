import type { PgMessageOutcomeRow } from "../../repository/engine/engine.entities.ts";

type AttrStat = Readonly<{
  value: string;
  sent: number;
  replied: number;
  positive: number;
}>;

function angleOf(row: PgMessageOutcomeRow): string | null {
  return row.angle_type ?? row.angle_type_inferred;
}

function aggregateDimension(
  rows: ReadonlyArray<PgMessageOutcomeRow>,
  pick: (row: PgMessageOutcomeRow) => string | null
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

  return [...byValue.values()].sort(
    (a, b) => b.positive - a.positive || b.replied - a.replied
  );
}

function formatBlock(
  title: string,
  stats: ReadonlyArray<AttrStat>
): string {
  if (stats.length === 0) return "";
  const lines = stats.map(
    (stat) =>
      `- ${stat.value}: ${stat.sent} sent, ${stat.replied} replied, ${stat.positive} positive`
  );
  return [`${title}:`, ...lines].join("\n");
}

export function buildStatsText(
  rows: ReadonlyArray<PgMessageOutcomeRow>
): string {
  const blocks = [
    formatBlock("By angle", aggregateDimension(rows, angleOf)),
    formatBlock(
      "By length",
      aggregateDimension(rows, (row) => row.length_bucket)
    ),
    formatBlock(
      "By CTA type",
      aggregateDimension(rows, (row) => row.cta_type)
    ),
    formatBlock(
      "By personalization depth",
      aggregateDimension(rows, (row) => row.perso_depth)
    ),
    formatBlock("By channel", aggregateDimension(rows, (row) => row.channel)),
  ].filter((block) => block !== "");

  return blocks.join("\n\n");
}
