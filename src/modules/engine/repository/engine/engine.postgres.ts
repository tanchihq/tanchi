import type { DbClient } from "@shared/db";
import { ARRAY, throwSanitizeError } from "@shared/utils";
import type {
  CreateCompanyInput,
  CreateLeadInput,
  CreateMessageDraftInput,
  PersistProfileInput,
  PgCopyAngle,
  PgCopyFact,
  PgEngineIcp,
  PgEngineLead,
  PgIcpEdit,
  PgMessageOutcomeRow,
  PgProfileConversionRow,
  PgEngineProfile,
  PgEngineRun,
} from "./engine.entities.ts";

export class EnginePostgres {
  constructor(private readonly db: DbClient) {}

  async getActiveRun(organizationId: string): Promise<PgEngineRun | null> {
    try {
      const result = await this.db<ReadonlyArray<PgEngineRun>>`
        SELECT id, organization_id, status, sourced, sourced_count, profiled_count, drafted_count
        FROM engine_run
        WHERE organization_id = ${organizationId} AND status = 'running'
        LIMIT 1
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async insertRunIfNone(
    id: string,
    organizationId: string
  ): Promise<PgEngineRun | null> {
    try {
      const result = await this.db<ReadonlyArray<PgEngineRun>>`
        INSERT INTO engine_run (id, organization_id)
        VALUES (${id}, ${organizationId})
        ON CONFLICT (organization_id) WHERE status = 'running' DO NOTHING
        RETURNING id, organization_id, status, sourced, sourced_count, profiled_count, drafted_count
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async markRunSourced(runId: string, sourcedCount: number): Promise<void> {
    try {
      await this.db`
        UPDATE engine_run
        SET sourced = TRUE, sourced_count = sourced_count + ${sourcedCount}, updated_at = NOW()
        WHERE id = ${runId}
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async addRunProgress(
    runId: string,
    profiledCount: number,
    draftedCount: number
  ): Promise<void> {
    try {
      await this.db`
        UPDATE engine_run
        SET profiled_count = profiled_count + ${profiledCount},
            drafted_count = drafted_count + ${draftedCount},
            updated_at = NOW()
        WHERE id = ${runId}
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async completeRun(runId: string): Promise<PgEngineRun | null> {
    try {
      const result = await this.db<ReadonlyArray<PgEngineRun>>`
        UPDATE engine_run
        SET status = 'complete', finished_at = NOW(), updated_at = NOW()
        WHERE id = ${runId}
        RETURNING id, organization_id, status, sourced, sourced_count, profiled_count, drafted_count
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async failRun(runId: string): Promise<void> {
    try {
      await this.db`
        UPDATE engine_run
        SET status = 'failed', finished_at = NOW(), updated_at = NOW()
        WHERE id = ${runId}
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getOrganizationIdsWithUnfinishedRun(): Promise<ReadonlyArray<string>> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ organization_id: string }>>>`
        SELECT DISTINCT organization_id FROM engine_run WHERE status = 'running'
      `;
      return result.map((row) => row.organization_id);
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getAllOrganizationIds(): Promise<ReadonlyArray<string>> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ id: string }>>>`
        SELECT id FROM organization
      `;
      return result.map((row) => row.id);
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getIcpsByOrganization(
    organizationId: string
  ): Promise<ReadonlyArray<PgEngineIcp>> {
    try {
      return await this.db<ReadonlyArray<PgEngineIcp>>`
        SELECT id, name, archetype, description, perceived_value, angle, golden_rule
        FROM icp WHERE organization_id = ${organizationId}
        ORDER BY position ASC
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getOrganizationProfile(
    organizationId: string
  ): Promise<PgEngineProfile | null> {
    try {
      const result = await this.db<ReadonlyArray<PgEngineProfile>>`
        SELECT website, product_page_url, sales_deck_url, outreach_language, company_profile
        FROM organization_profile WHERE organization_id = ${organizationId}
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getOrganizationName(
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

  async getOrganizationRecipient(
    organizationId: string
  ): Promise<
    Readonly<{
      email: string;
      name: string | null;
      organization_name: string;
    }> | null
  > {
    try {
      const result = await this.db<
        ReadonlyArray<
          Readonly<{
            email: string;
            name: string | null;
            organization_name: string;
          }>
        >
      >`
        SELECT u.email AS email, u.name AS name, o.name AS organization_name
        FROM member m
        JOIN "user" u ON u.id = m.user_id
        JOIN organization o ON o.id = m.organization_id
        WHERE m.organization_id = ${organizationId}
        ORDER BY (m.role = 'owner') DESC, m.created_at ASC
        LIMIT 1
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getLatestPlaybook(
    organizationId: string,
    icpId: string
  ): Promise<string | null> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ content: string }>>>`
        SELECT content FROM playbook
        WHERE organization_id = ${organizationId} AND icp_id = ${icpId}
        ORDER BY version DESC LIMIT 1
      `;
      return result[ARRAY.FIRST_INDEX]?.content ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getExistingCompanyDomains(
    organizationId: string
  ): Promise<ReadonlyArray<string>> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ domain: string }>>>`
        SELECT domain FROM companies
        WHERE organization_id = ${organizationId} AND domain IS NOT NULL
      `;
      return result.map((row) => row.domain);
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getExistingLeadEmails(
    organizationId: string
  ): Promise<ReadonlyArray<string>> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ email: string }>>>`
        SELECT email FROM leads
        WHERE organization_id = ${organizationId} AND email IS NOT NULL
      `;
      return result.map((row) => row.email);
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getExcludedEmails(
    organizationId: string
  ): Promise<ReadonlyArray<string>> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ email: string }>>>`
        SELECT email FROM exclusions
        WHERE organization_id = ${organizationId}
          AND scope = 'person' AND email IS NOT NULL
      `;
      return result.map((row) => row.email);
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getExcludedCompanyDomains(
    organizationId: string
  ): Promise<ReadonlyArray<string>> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ company_domain: string }>>>`
        SELECT company_domain FROM exclusions
        WHERE organization_id = ${organizationId}
          AND scope = 'company' AND company_domain IS NOT NULL
      `;
      return result.map((row) => row.company_domain);
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async createOneCompany(input: CreateCompanyInput): Promise<string> {
    const id = Bun.randomUUIDv7();
    try {
      await this.db`
        INSERT INTO companies (id, organization_id, name, domain, website, sector, size, hq)
        VALUES (
          ${id}, ${input.organizationId}, ${input.name}, ${input.domain},
          ${input.website}, ${input.sector}, ${input.size}, ${input.hq}
        )
      `;
      return id;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async createOneLead(input: CreateLeadInput): Promise<string> {
    const id = Bun.randomUUIDv7();
    try {
      await this.db`
        INSERT INTO leads (
          id, organization_id, company_id, icp_id, first_name, last_name,
          role, email, email_status, channel, source_provider
        )
        VALUES (
          ${id}, ${input.organizationId}, ${input.companyId}, ${input.icpId},
          ${input.firstName}, ${input.lastName}, ${input.role}, ${input.email},
          ${input.emailStatus}, ${input.channel}, ${input.sourceProvider}
        )
      `;
      return id;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getLeadsNeedingProfile(
    organizationId: string
  ): Promise<ReadonlyArray<PgEngineLead>> {
    try {
      return await this.db<ReadonlyArray<PgEngineLead>>`
        SELECT
          l.id, l.organization_id, l.first_name, l.last_name, l.role, l.email,
          l.linkedin_url, l.channel, l.icp_id,
          c.name AS company_name, c.domain AS company_domain, c.website AS company_website,
          c.sector AS company_sector, c.size AS company_size, c.hq AS company_hq,
          i.name AS icp_name, i.archetype AS icp_archetype, i.description AS icp_description,
          i.perceived_value AS icp_perceived_value, i.angle AS icp_angle,
          i.golden_rule AS icp_golden_rule
        FROM leads l
        LEFT JOIN companies c ON c.id = l.company_id
        LEFT JOIN icp i ON i.id = l.icp_id
        WHERE l.organization_id = ${organizationId}
          AND l.stage = 'identified'
          AND l.excluded_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM dossiers d WHERE d.lead_id = l.id)
        ORDER BY l.created_at ASC
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getLeadsNeedingCopy(
    organizationId: string
  ): Promise<ReadonlyArray<PgEngineLead>> {
    try {
      return await this.db<ReadonlyArray<PgEngineLead>>`
        SELECT
          l.id, l.organization_id, l.first_name, l.last_name, l.role, l.email,
          l.linkedin_url, l.channel, l.icp_id,
          c.name AS company_name, c.domain AS company_domain, c.website AS company_website,
          c.sector AS company_sector, c.size AS company_size, c.hq AS company_hq,
          i.name AS icp_name, i.archetype AS icp_archetype, i.description AS icp_description,
          i.perceived_value AS icp_perceived_value, i.angle AS icp_angle,
          i.golden_rule AS icp_golden_rule
        FROM leads l
        LEFT JOIN companies c ON c.id = l.company_id
        LEFT JOIN icp i ON i.id = l.icp_id
        WHERE l.organization_id = ${organizationId}
          AND l.excluded_at IS NULL
          AND EXISTS (SELECT 1 FROM dossiers d WHERE d.lead_id = l.id)
          AND NOT EXISTS (SELECT 1 FROM messages m WHERE m.lead_id = l.id)
        ORDER BY l.created_at ASC
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async persistProfile(input: PersistProfileInput): Promise<void> {
    const dossierId = Bun.randomUUIDv7();
    const factsWithIds = input.facts.map((fact) => ({
      id: Bun.randomUUIDv7(),
      fact,
    }));
    const factRows = factsWithIds.map(({ id, fact }) => ({
      id,
      dossier_id: dossierId,
      text: fact.text,
      source_url: fact.sourceUrl,
      evidence: fact.evidence,
      provenance: fact.provenance,
    }));
    const angleRows = input.angles.map((angle) => ({
      id: Bun.randomUUIDv7(),
      dossier_id: dossierId,
      rank: angle.rank,
      title: angle.title,
      note: angle.note,
      angle_type: angle.angleType,
      fact_id: factsWithIds[angle.factIndex]?.id ?? null,
      chosen: angle.chosen,
    }));

    try {
      await this.db.begin(async (tx) => {
        await tx`
          INSERT INTO dossiers (id, organization_id, lead_id, summary)
          VALUES (${dossierId}, ${input.organizationId}, ${input.leadId}, ${input.summary})
        `;
        if (factRows.length > ARRAY.EMPTY_LENGTH) {
          await tx`
            INSERT INTO dossier_facts ${tx(
              factRows,
              "id",
              "dossier_id",
              "text",
              "source_url",
              "evidence",
              "provenance"
            )}
          `;
        }
        if (angleRows.length > ARRAY.EMPTY_LENGTH) {
          await tx`
            INSERT INTO dossier_angles ${tx(
              angleRows,
              "id",
              "dossier_id",
              "rank",
              "title",
              "note",
              "angle_type",
              "fact_id",
              "chosen"
            )}
          `;
        }
        await tx`
          UPDATE leads
          SET qualification = ${input.qualification}, score = ${input.score},
              channel = ${input.channel},
              linkedin_url = COALESCE(${input.linkedinUrl}, linkedin_url),
              instagram_url = COALESCE(${input.instagramUrl}, instagram_url),
              updated_at = NOW()
          WHERE id = ${input.leadId}
        `;
      });
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getDossierSummaryForLead(leadId: string): Promise<string | null> {
    try {
      const result = await this.db<
        ReadonlyArray<Readonly<{ summary: string | null }>>
      >`
        SELECT summary FROM dossiers WHERE lead_id = ${leadId}
      `;
      return result[ARRAY.FIRST_INDEX]?.summary ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getFactsForLead(
    leadId: string
  ): Promise<ReadonlyArray<PgCopyFact>> {
    try {
      return await this.db<ReadonlyArray<PgCopyFact>>`
        SELECT df.text, df.source_url
        FROM dossier_facts df
        JOIN dossiers d ON d.id = df.dossier_id
        WHERE d.lead_id = ${leadId}
        ORDER BY df.created_at ASC
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getChosenAngleForLead(
    leadId: string
  ): Promise<PgCopyAngle | null> {
    try {
      const result = await this.db<ReadonlyArray<PgCopyAngle>>`
        SELECT da.title, da.note, da.angle_type
        FROM dossier_angles da
        JOIN dossiers d ON d.id = da.dossier_id
        WHERE d.lead_id = ${leadId}
        ORDER BY da.chosen DESC, da.rank ASC
        LIMIT 1
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getSentMessageOutcomesForIcp(
    organizationId: string,
    icpId: string,
    sinceDays: number
  ): Promise<ReadonlyArray<PgMessageOutcomeRow>> {
    try {
      return await this.db<ReadonlyArray<PgMessageOutcomeRow>>`
        SELECT
          m.angle_type, m.angle_type_inferred, m.length_bucket,
          m.cta_type, m.perso_depth, m.channel, m.subject, m.body,
          COALESCE((
            SELECT bool_or(o.classification = 'positive'
              OR o.stage_signal IN ('positive','meeting','deal'))
            FROM outcomes o WHERE o.message_id = m.id
          ), FALSE) AS positive,
          COALESCE((
            SELECT bool_or(o.stage_signal = 'replied' OR o.classification IS NOT NULL)
            FROM outcomes o WHERE o.message_id = m.id
          ), FALSE) AS replied
        FROM messages m
        WHERE m.organization_id = ${organizationId}
          AND m.icp_id = ${icpId}
          AND m.status = 'sent'
          AND m.sent_at >= NOW() - MAKE_INTERVAL(days => ${sinceDays})
        ORDER BY m.sent_at DESC
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getProfileConversionForIcp(
    organizationId: string,
    icpId: string,
    sinceDays: number
  ): Promise<ReadonlyArray<PgProfileConversionRow>> {
    try {
      return await this.db<ReadonlyArray<PgProfileConversionRow>>`
        SELECT
          c.sector, c.size, c.hq, l.role, l.qualification,
          agg.positive, agg.replied
        FROM leads l
        LEFT JOIN companies c ON c.id = l.company_id
        JOIN LATERAL (
          SELECT
            COALESCE(bool_or(o.classification = 'positive'
              OR o.stage_signal IN ('positive','meeting','deal')), FALSE) AS positive,
            COALESCE(bool_or(o.stage_signal = 'replied'
              OR o.classification IS NOT NULL), FALSE) AS replied
          FROM outcomes o WHERE o.lead_id = l.id
        ) agg ON TRUE
        WHERE l.organization_id = ${organizationId}
          AND l.icp_id = ${icpId}
          AND l.created_at >= NOW() - MAKE_INTERVAL(days => ${sinceDays})
          AND EXISTS (SELECT 1 FROM outcomes o2 WHERE o2.lead_id = l.id)
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getRecentEditsForIcp(
    organizationId: string,
    icpId: string,
    limit: number
  ): Promise<ReadonlyArray<PgIcpEdit>> {
    try {
      return await this.db<ReadonlyArray<PgIcpEdit>>`
        SELECT e.ai_version, e.edited_version, m.angle_type
        FROM edits e
        JOIN messages m ON m.id = e.message_id
        WHERE e.organization_id = ${organizationId}
          AND m.icp_id = ${icpId}
        ORDER BY e.created_at DESC
        LIMIT ${limit}
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async insertPlaybook(
    organizationId: string,
    icpId: string,
    content: string
  ): Promise<void> {
    try {
      await this.db`
        INSERT INTO playbook (id, organization_id, icp_id, content, version, generated_at)
        VALUES (
          ${Bun.randomUUIDv7()}, ${organizationId}, ${icpId}, ${content},
          COALESCE((
            SELECT MAX(version) FROM playbook
            WHERE organization_id = ${organizationId} AND icp_id = ${icpId}
          ), 0) + 1,
          NOW()
        )
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async createOneMessageDraft(
    input: CreateMessageDraftInput
  ): Promise<void> {
    try {
      await this.db`
        INSERT INTO messages (
          id, organization_id, lead_id, icp_id, channel, subject, body,
          status, origin, is_exploration, angle_type, angle_type_inferred,
          length_bucket, cta_type, perso_depth, slot
        )
        VALUES (
          ${Bun.randomUUIDv7()}, ${input.organizationId}, ${input.leadId},
          ${input.icpId}, ${input.channel}, ${input.subject}, ${input.body},
          'draft', 'auto', ${input.isExploration}, ${input.angleType},
          ${input.angleTypeInferred}, ${input.lengthBucket}, ${input.ctaType},
          ${input.persoDepth}, ${input.slot}
        )
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }
}
