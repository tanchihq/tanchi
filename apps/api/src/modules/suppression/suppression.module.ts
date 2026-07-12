import { db } from "../../db.ts";
import { SuppressionPostgres } from "./repository/suppression/suppression.postgres.ts";
import { SuppressionRepository } from "./repository/suppression/suppression.repository.ts";
import { SuppressionService } from "./suppression.service.ts";
import { createSuppressionRouter } from "./suppression.controller.ts";

const suppressionRepository = new SuppressionRepository(
  new SuppressionPostgres(db)
);
const suppressionService = new SuppressionService(suppressionRepository);

export const suppressionRouter = createSuppressionRouter(suppressionService);
