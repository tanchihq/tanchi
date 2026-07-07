import { db } from "../../db.ts";
import { SettingsPostgres } from "./repository/settings/settings.postgres.ts";
import { SettingsRepository } from "./repository/settings/settings.repository.ts";
import { SettingsService } from "./settings.service.ts";
import { createSettingsRouter } from "./settings.controller.ts";

const settingsRepository = new SettingsRepository(new SettingsPostgres(db));
const settingsService = new SettingsService(settingsRepository);

export const settingsRouter = createSettingsRouter(settingsService);
