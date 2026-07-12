import { db } from "../../db.ts";
import { QueuePostgres } from "./repository/queue/queue.postgres.ts";
import { QueueRepository } from "./repository/queue/queue.repository.ts";
import { QueueService } from "./queue.service.ts";
import { createQueueRouter } from "./queue.controller.ts";

const queueRepository = new QueueRepository(new QueuePostgres(db));
const queueService = new QueueService(queueRepository);

export const queueRouter = createQueueRouter(queueService);
