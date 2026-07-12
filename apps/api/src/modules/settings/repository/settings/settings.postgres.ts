import type { DbClient } from "@shared/db";
import { ARRAY, throwSanitizeError } from "@shared/utils";
import type {
  PgIcp,
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
        SELECT * FROM organization_profile WHERE organization_id = ${organizationId}
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
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
    const icpRows = input.icps.map((icp, index) => ({
      id: Bun.randomUUIDv7(),
      organization_id: input.organizationId,
      name: icp.name,
      archetype: emptyToNull(icp.archetype),
      description: icp.description,
      perceived_value: emptyToNull(icp.perceivedValue),
      angle: emptyToNull(icp.angle),
      golden_rule: emptyToNull(icp.goldenRule),
      position: index,
    }));

    try {
      await this.db.begin(async (tx) => {
        await tx`
          UPDATE organization SET name = ${input.companyName}
          WHERE id = ${input.organizationId}
        `;

        await tx`
          INSERT INTO organization_profile (
            organization_id, website, product_page_url, sales_deck_url,
            outreach_language, company_profile, follow_up_intervals,
            excluded_weekdays, leads_per_day
          )
          VALUES (
            ${input.organizationId},
            ${input.website},
            ${emptyToNull(input.productPageUrl)},
            ${emptyToNull(input.salesDeckUrl)},
            ${input.outreachLanguage},
            ${input.companyProfile},
            ${[...input.followUpIntervals]}::int[],
            ${[...input.excludedWeekdays]}::int[],
            ${input.leadsPerDay}
          )
          ON CONFLICT (organization_id) DO UPDATE SET
            website = EXCLUDED.website,
            product_page_url = EXCLUDED.product_page_url,
            sales_deck_url = EXCLUDED.sales_deck_url,
            outreach_language = EXCLUDED.outreach_language,
            company_profile = EXCLUDED.company_profile,
            follow_up_intervals = EXCLUDED.follow_up_intervals,
            excluded_weekdays = EXCLUDED.excluded_weekdays,
            leads_per_day = EXCLUDED.leads_per_day,
            updated_at = NOW()
        `;

        await tx`DELETE FROM icp WHERE organization_id = ${input.organizationId}`;
        await tx`
          INSERT INTO icp ${tx(
            icpRows,
            "id",
            "organization_id",
            "name",
            "archetype",
            "description",
            "perceived_value",
            "angle",
            "golden_rule",
            "position"
          )}
        `;
      });
    } catch (error) {
      return throwSanitizeError(error);
    }
  }
}
