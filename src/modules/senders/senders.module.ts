import { db } from "../../db.ts";
import { SendersPostgres } from "./repository/senders/senders.postgres.ts";
import { SendersRepository } from "./repository/senders/senders.repository.ts";
import { SendersService } from "./senders.service.ts";
import { createSendersRouter } from "./senders.controller.ts";

const sendersRepository = new SendersRepository(new SendersPostgres(db));
const sendersService = new SendersService(sendersRepository);

export const sendersRouter = createSendersRouter(sendersService);
