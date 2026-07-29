import type { DbClient } from "@shared/db";
import { ARRAY, throwSanitizeError } from "@shared/utils";
import type {
  PgIcp,
  PgMarket,
  PgOrganizationProfile,
  UpdateSettingsInput,
} from "./settings.entities.ts";

function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}

export class SettingsPostgres {
  constructor(private readonly db: DbClient) {}

  async getOrganizationNameById(
    organizationId: string
  ): Promise<string | null> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ name: string }>>>`
        SELECT name FROM organization WHERE id = ${organizationId}
      `;
      return result[ARRAY.FIRST_INDEX]?.name ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getOrganizationProfileByOrganization(
    organizationId: string
  ): Promise<PgOrganizationProfile | null> {
    try {
      const result = await this.db<ReadonlyArray<PgOrganizationProfile>>`
        SELECT organization_id, website, product_page_url, sales_deck_url,
          onboarded_at, created_at, updated_at
        FROM organization_profile WHERE organization_id = ${organizationId}
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getMarketsByOrganization(
    organizationId: string
  ): Promise<ReadonlyArray<PgMarket>> {
    try {
      const result = await this.db<ReadonlyArray<PgMarket>>`
        SELECT * FROM market
        WHERE organization_id = ${organizationId}
        ORDER BY position ASC
      `;
      return result;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getIcpsByOrganization(
    organizationId: string
  ): Promise<ReadonlyArray<PgIcp>> {
    try {
      const result = await this.db<ReadonlyArray<PgIcp>>`
        SELECT * FROM icp
        WHERE organization_id = ${organizationId}
        ORDER BY position ASC
      `;
      return result;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async updateSettings(input: UpdateSettingsInput): Promise<void> {
    const markets = input.markets.map((market, position) => ({
      source: market,
      id: market.id ?? Bun.randomUUIDv7(),
      position,
    }));

    const marketRows = markets.map(({ source, id, position }) => ({
      id,
      organization_id: input.organizationId,
      name: source.name,
      country: source.country,
      outreach_language: source.outreachLanguage,
      company_profile: source.companyProfile,
      leads_per_day: source.leadsPerDay,
      follow_up_intervals: [...source.followUpIntervals],
      excluded_weekdays: [...source.excludedWeekdays],
      position,
    }));

    const icpRows = markets.flatMap(({ source, id: marketId }) =>
      source.icps.map((icp, position) => ({
        id: icp.id ?? Bun.randomUUIDv7(),
        organization_id: input.organizationId,
        market_id: marketId,
        name: icp.name,
        archetype: emptyToNull(icp.archetype),
        description: icp.description,
        perceived_value: emptyToNull(icp.perceivedValue),
        angle: emptyToNull(icp.angle),
        golden_rule: emptyToNull(icp.goldenRule),
        position,
      }))
    );

    const marketIds = marketRows.map((row) => row.id);
    const icpIds = icpRows.map((row) => row.id);

    try {
      await this.db.begin(async (tx) => {
        await tx`
          UPDATE organization SET name = ${input.companyName}
          WHERE id = ${input.organizationId}
        `;

        await tx`
          INSERT INTO organization_profile (
            organization_id, website, product_page_url, sales_deck_url
          )
          VALUES (
            ${input.organizationId},
            ${input.website},
            ${emptyToNull(input.productPageUrl)},
            ${emptyToNull(input.salesDeckUrl)}
          )
          ON CONFLICT (organization_id) DO UPDATE SET
            website = EXCLUDED.website,
            product_page_url = EXCLUDED.product_page_url,
            sales_deck_url = EXCLUDED.sales_deck_url,
            updated_at = NOW()
        `;

        await tx`
          DELETE FROM icp
          WHERE organization_id = ${input.organizationId}
            AND id <> ALL(${icpIds}::uuid[])
        `;

        await tx`
          DELETE FROM market
          WHERE organization_id = ${input.organizationId}
            AND id <> ALL(${marketIds}::uuid[])
        `;

        await tx`
          INSERT INTO market ${tx(
            marketRows,
            "id",
            "organization_id",
            "name",
            "country",
            "outreach_language",
            "company_profile",
            "leads_per_day",
            "follow_up_intervals",
            "excluded_weekdays",
            "position"
          )}
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            country = EXCLUDED.country,
            outreach_language = EXCLUDED.outreach_language,
            company_profile = EXCLUDED.company_profile,
            leads_per_day = EXCLUDED.leads_per_day,
            follow_up_intervals = EXCLUDED.follow_up_intervals,
            excluded_weekdays = EXCLUDED.excluded_weekdays,
            position = EXCLUDED.position
          WHERE market.organization_id = ${input.organizationId}
        `;

        if (icpRows.length > ARRAY.EMPTY_LENGTH) {
          await tx`
            INSERT INTO icp ${tx(
              icpRows,
              "id",
              "organization_id",
              "market_id",
              "name",
              "archetype",
              "description",
              "perceived_value",
              "angle",
              "golden_rule",
              "position"
            )}
            ON CONFLICT (id) DO UPDATE SET
              market_id = EXCLUDED.market_id,
              name = EXCLUDED.name,
              archetype = EXCLUDED.archetype,
              description = EXCLUDED.description,
              perceived_value = EXCLUDED.perceived_value,
              angle = EXCLUDED.angle,
              golden_rule = EXCLUDED.golden_rule,
              position = EXCLUDED.position
            WHERE icp.organization_id = ${input.organizationId}
          `;
        }
      });
    } catch (error) {
      return throwSanitizeError(error);
    }
  }
}
