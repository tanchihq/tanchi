import { db } from "../../db.ts";
import { LearningsPostgres } from "./repository/learnings/learnings.postgres.ts";
import { LearningsRepository } from "./repository/learnings/learnings.repository.ts";
import { LearningsService } from "./learnings.service.ts";
import { createLearningsRouter } from "./learnings.controller.ts";

const learningsRepository = new LearningsRepository(new LearningsPostgres(db));
const learningsService = new LearningsService(learningsRepository);

export const learningsRouter = createLearningsRouter(learningsService);
