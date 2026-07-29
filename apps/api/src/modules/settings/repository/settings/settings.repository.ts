import type { SettingsPostgres } from "./settings.postgres.ts";
import type {
  PgIcp,
  PgMarket,
  PgOrganizationProfile,
  UpdateSettingsInput,
} from "./settings.entities.ts";

export class SettingsRepository {
  constructor(private readonly settingsPostgres: SettingsPostgres) {}

  getOrganizationNameById(organizationId: string): Promise<string | null> {
    return this.settingsPostgres.getOrganizationNameById(organizationId);
  }

  getOrganizationProfileByOrganization(
    organizationId: string
  ): Promise<PgOrganizationProfile | null> {
    return this.settingsPostgres.getOrganizationProfileByOrganization(
      organizationId
    );
  }

  getMarketsByOrganization(
    organizationId: string
  ): Promise<ReadonlyArray<PgMarket>> {
    return this.settingsPostgres.getMarketsByOrganization(organizationId);
  }

  getIcpsByOrganization(organizationId: string): Promise<ReadonlyArray<PgIcp>> {
    return this.settingsPostgres.getIcpsByOrganization(organizationId);
  }

  updateSettings(input: UpdateSettingsInput): Promise<void> {
    return this.settingsPostgres.updateSettings(input);
  }
}
