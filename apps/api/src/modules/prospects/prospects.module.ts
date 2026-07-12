import { db } from "../../db.ts";
import { ProspectsPostgres } from "./repository/prospects/prospects.postgres.ts";
import { ProspectsRepository } from "./repository/prospects/prospects.repository.ts";
import { ProspectsService } from "./prospects.service.ts";
import { createProspectsRouter } from "./prospects.controller.ts";

const prospectsRepository = new ProspectsRepository(
  new ProspectsPostgres(db)
);
const prospectsService = new ProspectsService(prospectsRepository);

export const prospectsRouter = createProspectsRouter(prospectsService);
