import type { DbClient } from "@shared/db";
import { ARRAY, throwSanitizeError } from "@shared/utils";
import type {
  CompleteOnboardingInput,
  CreateOrganizationWithOwnerInput,
  PgOnboardingState,
  UpsertOnboardingProgressInput,
} from "./onboarding.entities.ts";

function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}

export class OnboardingPostgres {
  constructor(private readonly db: DbClient) {}

  async existsUserByEmail(email: string): Promise<boolean> {
    try {
      const rows = await this.db<ReadonlyArray<Readonly<{ exists: boolean }>>>`
        SELECT EXISTS(SELECT 1 FROM "user" WHERE email = ${email}) AS exists
      `;
      return rows[ARRAY.FIRST_INDEX]?.exists ?? false;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async deleteOneUser(id: string): Promise<void> {
    try {
      await this.db`DELETE FROM "user" WHERE id = ${id}`;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async deleteOneOrganization(id: string): Promise<void> {
    try {
      await this.db`DELETE FROM organization WHERE id = ${id}`;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async createOrganizationWithOwner(
    input: CreateOrganizationWithOwnerInput
  ): Promise<void> {
    try {
      await this.db.begin(async (tx) => {
        await tx`
          INSERT INTO organization (id, name, slug)
          VALUES (${input.organizationId}, ${input.name}, ${input.slug})
        `;
        await tx`
          INSERT INTO member (id, user_id, organization_id, role)
          VALUES (${input.memberId}, ${input.userId}, ${input.organizationId}, 'owner')
        `;
      });
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getOneOnboardingStateByOrganization(
    organizationId: string
  ): Promise<PgOnboardingState | null> {
    try {
      const result = await this.db<ReadonlyArray<PgOnboardingState>>`
        SELECT * FROM onboarding_state WHERE organization_id = ${organizationId}
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

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

  async upsertOnboardingProgress(
    input: UpsertOnboardingProgressInput
  ): Promise<void> {
    try {
      await this.db`
        INSERT INTO onboarding_state (organization_id, current_step, draft)
        VALUES (
          ${input.organizationId},
          ${input.currentStep},
          ${this.db.json(input.draft as never)}
        )
        ON CONFLICT (organization_id) DO UPDATE SET
          current_step = EXCLUDED.current_step,
          draft = EXCLUDED.draft,
          updated_at = NOW()
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async completeOnboarding(input: CompleteOnboardingInput): Promise<void> {
    const marketId = Bun.randomUUIDv7();
    const icpRows = input.icps.map((icp, index) => ({
      id: Bun.randomUUIDv7(),
      organization_id: input.organizationId,
      market_id: marketId,
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
          INSERT INTO organization_profile (
            organization_id, website, product_page_url, sales_deck_url,
            onboarded_at
          )
          VALUES (
            ${input.organizationId},
            ${input.profile.website},
            ${emptyToNull(input.profile.productPageUrl)},
            ${emptyToNull(input.profile.salesDeckUrl)},
            NOW()
          )
          ON CONFLICT (organization_id) DO UPDATE SET
            website = EXCLUDED.website,
            product_page_url = EXCLUDED.product_page_url,
            sales_deck_url = EXCLUDED.sales_deck_url,
            onboarded_at = NOW(),
            updated_at = NOW()
        `;

        await tx`DELETE FROM market WHERE organization_id = ${input.organizationId}`;
        await tx`
          INSERT INTO market (
            id, organization_id, name, country, outreach_language, company_profile, position
          )
          VALUES (
            ${marketId},
            ${input.organizationId},
            'United States',
            'US',
            'en',
            ${input.profile.companyProfile},
            0
          )
        `;
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
        `;

        await tx`
          INSERT INTO onboarding_state (organization_id, status, current_step, draft)
          VALUES (
            ${input.organizationId},
            'completed',
            ${input.currentStep},
            ${tx.json(input.draft as never)}
          )
          ON CONFLICT (organization_id) DO UPDATE SET
            status = 'completed',
            current_step = EXCLUDED.current_step,
            draft = EXCLUDED.draft,
            updated_at = NOW()
        `;
      });
    } catch (error) {
      return throwSanitizeError(error);
    }
  }
}
