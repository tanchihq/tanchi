import type postgres from "postgres";
import type { Sql } from "postgres";
import { createAdapterFactory } from "better-auth/adapters";
import type { CleanedWhere } from "@better-auth/core/db/adapter";

type SqlParam = postgres.ParameterOrJSON<never>;

const IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const ARRAY_EMPTY = 0;
const PARAM_INDEX_START = 1;

function ensureSafeIdent(name: string): string {
  if (!IDENTIFIER_PATTERN.test(name)) {
    throw new Error(`[postgres-adapter] unsafe identifier: ${name}`);
  }
  return name;
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function quoteIdent(name: string): string {
  ensureSafeIdent(name);
  return `"${name}"`;
}

function tableIdent(model: string): string {
  return quoteIdent(camelToSnake(model));
}

function columnIdent(field: string): string {
  return quoteIdent(camelToSnake(field));
}

function rowToBetterAuth<T = Readonly<Record<string, unknown>>>(
  row: Readonly<Record<string, unknown>>
): T {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [snakeToCamel(key), value])
  ) as T;
}

interface BuiltClause {
  readonly fragment: string;
  readonly params: ReadonlyArray<SqlParam>;
  readonly nextIndex: number;
}

interface BuiltWhere {
  readonly fragment: string;
  readonly params: ReadonlyArray<SqlParam>;
  readonly nextIndex: number;
}

const COMPARISON_OPS: Readonly<Record<"lt" | "lte" | "gt" | "gte", string>> = {
  lt: "<",
  lte: "<=",
  gt: ">",
  gte: ">=",
};

function buildClause(clause: CleanedWhere, startIndex: number): BuiltClause {
  const col = columnIdent(clause.field);
  const value = clause.value;
  const insensitive = clause.mode === "insensitive";

  switch (clause.operator) {
    case "eq": {
      if (value === null) {
        return {
          fragment: `${col} IS NULL`,
          params: [],
          nextIndex: startIndex,
        };
      }
      if (insensitive && typeof value === "string") {
        return {
          fragment: `LOWER(${col}) = LOWER($${startIndex})`,
          params: [value],
          nextIndex: startIndex + 1,
        };
      }
      return {
        fragment: `${col} = $${startIndex}`,
        params: [value as SqlParam],
        nextIndex: startIndex + 1,
      };
    }
    case "ne": {
      if (value === null) {
        return {
          fragment: `${col} IS NOT NULL`,
          params: [],
          nextIndex: startIndex,
        };
      }
      if (insensitive && typeof value === "string") {
        return {
          fragment: `LOWER(${col}) <> LOWER($${startIndex})`,
          params: [value],
          nextIndex: startIndex + 1,
        };
      }
      return {
        fragment: `${col} <> $${startIndex}`,
        params: [value as SqlParam],
        nextIndex: startIndex + 1,
      };
    }
    case "lt":
    case "lte":
    case "gt":
    case "gte": {
      return {
        fragment: `${col} ${COMPARISON_OPS[clause.operator]} $${startIndex}`,
        params: [value as SqlParam],
        nextIndex: startIndex + 1,
      };
    }
    case "in":
    case "not_in": {
      if (!Array.isArray(value)) {
        throw new Error(
          `[postgres-adapter] operator ${clause.operator} requires array value`
        );
      }
      if (value.length === ARRAY_EMPTY) {
        return {
          fragment: clause.operator === "in" ? "FALSE" : "TRUE",
          params: [],
          nextIndex: startIndex,
        };
      }
      const placeholders = value.map((_, i) => `$${startIndex + i}`).join(", ");
      const sqlOp = clause.operator === "in" ? "IN" : "NOT IN";
      return {
        fragment: `${col} ${sqlOp} (${placeholders})`,
        params: value as ReadonlyArray<SqlParam>,
        nextIndex: startIndex + value.length,
      };
    }
    case "contains": {
      const op = insensitive ? "ILIKE" : "LIKE";
      return {
        fragment: `${col} ${op} $${startIndex}`,
        params: [`%${String(value)}%`],
        nextIndex: startIndex + 1,
      };
    }
    case "starts_with": {
      const op = insensitive ? "ILIKE" : "LIKE";
      return {
        fragment: `${col} ${op} $${startIndex}`,
        params: [`${String(value)}%`],
        nextIndex: startIndex + 1,
      };
    }
    case "ends_with": {
      const op = insensitive ? "ILIKE" : "LIKE";
      return {
        fragment: `${col} ${op} $${startIndex}`,
        params: [`%${String(value)}`],
        nextIndex: startIndex + 1,
      };
    }
    default:
      throw new Error(
        `[postgres-adapter] unsupported operator: ${String(clause.operator)}`
      );
  }
}

interface WhereAcc {
  readonly parts: ReadonlyArray<string>;
  readonly params: ReadonlyArray<SqlParam>;
  readonly nextIndex: number;
}

function buildWhere(
  where: ReadonlyArray<CleanedWhere> | undefined,
  startIndex: number
): BuiltWhere {
  if (!where || where.length === ARRAY_EMPTY) {
    return { fragment: "", params: [], nextIndex: startIndex };
  }
  const acc = where.reduce<WhereAcc>(
    (a, clause, idx) => {
      const built = buildClause(clause, a.nextIndex);
      const connectorPrefix =
        idx === ARRAY_EMPTY
          ? ""
          : `${clause.connector === "OR" ? "OR" : "AND"} `;
      return {
        parts: [...a.parts, `${connectorPrefix}${built.fragment}`],
        params: [...a.params, ...built.params],
        nextIndex: built.nextIndex,
      };
    },
    { parts: [], params: [], nextIndex: startIndex }
  );
  return {
    fragment: ` WHERE ${acc.parts.join(" ")}`,
    params: acc.params,
    nextIndex: acc.nextIndex,
  };
}

function buildSelectClause(select: ReadonlyArray<string> | undefined): string {
  if (!select || select.length === ARRAY_EMPTY) {
    return "*";
  }
  return select.map((f) => `${columnIdent(f)} AS ${columnIdent(f)}`).join(", ");
}

interface BuiltPagination {
  readonly query: string;
  readonly params: ReadonlyArray<SqlParam>;
}

function buildPagination(
  startIndex: number,
  limit: number | undefined,
  offset: number | undefined
): BuiltPagination {
  const limitPart =
    typeof limit === "number"
      ? {
          query: ` LIMIT $${startIndex}`,
          params: [limit] as ReadonlyArray<SqlParam>,
          nextIndex: startIndex + 1,
        }
      : {
          query: "",
          params: [] as ReadonlyArray<SqlParam>,
          nextIndex: startIndex,
        };
  const offsetPart =
    typeof offset === "number"
      ? {
          query: ` OFFSET $${limitPart.nextIndex}`,
          params: [offset] as ReadonlyArray<SqlParam>,
        }
      : { query: "", params: [] as ReadonlyArray<SqlParam> };
  return {
    query: `${limitPart.query}${offsetPart.query}`,
    params: [...limitPart.params, ...offsetPart.params],
  };
}

interface BuiltAssignments {
  readonly fragment: string;
  readonly params: ReadonlyArray<SqlParam>;
  readonly nextIndex: number;
}

function buildAssignments(
  entries: ReadonlyArray<readonly [string, unknown]>,
  startIndex: number
): BuiltAssignments {
  const cells = entries.map(([k, v], idx) => ({
    fragment: `${columnIdent(k)} = $${startIndex + idx}`,
    param: v as SqlParam,
  }));
  return {
    fragment: cells.map((c) => c.fragment).join(", "),
    params: cells.map((c) => c.param),
    nextIndex: startIndex + entries.length,
  };
}

export interface PostgresAdapterConfig {
  readonly debugLogs?: boolean;
}

export function postgresAdapter(db: Sql, config: PostgresAdapterConfig = {}) {
  return createAdapterFactory({
    config: {
      adapterId: "postgres",
      adapterName: "Postgres SQL Adapter",
      usePlural: false,
      debugLogs: config.debugLogs ?? false,
      supportsArrays: false,
      supportsBooleans: true,
      supportsDates: true,
      supportsJSON: false,
      supportsNumericIds: false,
      transaction: false,
    },
    adapter: () => {
      return {
        async create({ model, data }) {
          const entries = Object.entries(
            data as Readonly<Record<string, unknown>>
          );
          if (entries.length === ARRAY_EMPTY) {
            throw new Error(
              `[postgres-adapter] create called with empty data for model ${model}`
            );
          }
          const cols = entries.map(([k]) => columnIdent(k)).join(", ");
          const placeholders = entries
            .map((_, idx) => `$${idx + PARAM_INDEX_START}`)
            .join(", ");
          const params: ReadonlyArray<SqlParam> = entries.map(
            ([, v]) => v as SqlParam
          );
          const query = `INSERT INTO ${tableIdent(model)} (${cols}) VALUES (${placeholders}) RETURNING *`;
          const rows = await db.unsafe<Array<Record<string, unknown>>>(query, [
            ...params,
          ]);
          const row = rows[0];
          if (!row) {
            throw new Error(
              `[postgres-adapter] create on ${model} returned no row`
            );
          }
          return rowToBetterAuth(row);
        },

        async findOne({ model, where, select }) {
          const w = buildWhere(where, PARAM_INDEX_START);
          const cols = buildSelectClause(select);
          const query = `SELECT ${cols} FROM ${tableIdent(model)}${w.fragment} LIMIT 1`;
          const rows = await db.unsafe<Array<Record<string, unknown>>>(query, [
            ...w.params,
          ]);
          const row = rows[0];
          return row ? rowToBetterAuth(row) : null;
        },

        async findMany({ model, where, limit, select, sortBy, offset }) {
          const w = buildWhere(where, PARAM_INDEX_START);
          const cols = buildSelectClause(select);
          const orderClause = sortBy
            ? ` ORDER BY ${columnIdent(sortBy.field)} ${
                sortBy.direction === "desc" ? "DESC" : "ASC"
              }`
            : "";
          const pagination = buildPagination(w.nextIndex, limit, offset);
          const query = `SELECT ${cols} FROM ${tableIdent(model)}${w.fragment}${orderClause}${pagination.query}`;
          const params: ReadonlyArray<SqlParam> = [
            ...w.params,
            ...pagination.params,
          ];
          const rows = await db.unsafe<Array<Record<string, unknown>>>(query, [
            ...params,
          ]);
          return rows.map((r) => rowToBetterAuth(r));
        },

        async count({ model, where }) {
          const w = buildWhere(where, PARAM_INDEX_START);
          const query = `SELECT COUNT(*)::int AS count FROM ${tableIdent(model)}${w.fragment}`;
          const rows = await db.unsafe<Array<{ count: number }>>(query, [
            ...w.params,
          ]);
          return rows[0]?.count ?? ARRAY_EMPTY;
        },

        async update({ model, where, update }) {
          const entries = Object.entries(
            update as Readonly<Record<string, unknown>>
          );
          if (entries.length === ARRAY_EMPTY) {
            const w = buildWhere(where, PARAM_INDEX_START);
            const rows = await db.unsafe<Array<Record<string, unknown>>>(
              `SELECT * FROM ${tableIdent(model)}${w.fragment} LIMIT 1`,
              [...w.params]
            );
            const row = rows[0];
            return row ? rowToBetterAuth(row) : null;
          }
          const sets = buildAssignments(entries, PARAM_INDEX_START);
          const w = buildWhere(where, sets.nextIndex);
          const params: ReadonlyArray<SqlParam> = [...sets.params, ...w.params];
          const query = `UPDATE ${tableIdent(model)} SET ${sets.fragment}${w.fragment} RETURNING *`;
          const rows = await db.unsafe<Array<Record<string, unknown>>>(query, [
            ...params,
          ]);
          const row = rows[0];
          return row ? rowToBetterAuth(row) : null;
        },

        async updateMany({ model, where, update }) {
          const entries = Object.entries(update);
          if (entries.length === ARRAY_EMPTY) {
            return ARRAY_EMPTY;
          }
          const sets = buildAssignments(entries, PARAM_INDEX_START);
          const w = buildWhere(where, sets.nextIndex);
          const params: ReadonlyArray<SqlParam> = [...sets.params, ...w.params];
          const query = `UPDATE ${tableIdent(model)} SET ${sets.fragment}${w.fragment}`;
          const result = await db.unsafe(query, [...params]);
          return result.count ?? ARRAY_EMPTY;
        },

        async delete({ model, where }) {
          const w = buildWhere(where, PARAM_INDEX_START);
          const query = `DELETE FROM ${tableIdent(model)}${w.fragment}`;
          await db.unsafe(query, [...w.params]);
        },

        async deleteMany({ model, where }) {
          const w = buildWhere(where, PARAM_INDEX_START);
          const query = `DELETE FROM ${tableIdent(model)}${w.fragment}`;
          const result = await db.unsafe(query, [...w.params]);
          return result.count ?? ARRAY_EMPTY;
        },
      };
    },
  });
}
