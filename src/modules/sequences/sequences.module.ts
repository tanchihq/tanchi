import { db } from "../../db.ts";
import { llm } from "@shared/llm";
import { SequencesPostgres } from "./repository/sequences/sequences.postgres.ts";
import { SequencesRepository } from "./repository/sequences/sequences.repository.ts";
import { SequencesService } from "./sequences.service.ts";
import { startSequencesWorker } from "./sequences.worker.ts";

const sequencesRepository = new SequencesRepository(new SequencesPostgres(db));
const sequencesService = new SequencesService(sequencesRepository, llm);

export function startSequencesWorkers(): void {
  startSequencesWorker(sequencesService);
}
