import {
  Queue,
  Worker,
  type ConnectionOptions,
  type Processor,
} from "bullmq";
import { env } from "../../env.ts";

const DEFAULT_REDIS_PORT = 6379;

function buildConnection(): ConnectionOptions {
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: url.port === "" ? DEFAULT_REDIS_PORT : Number(url.port),
    ...(url.username !== "" && { username: url.username }),
    ...(url.password !== "" && { password: url.password }),
    maxRetriesPerRequest: null,
  };
}

const connection = buildConnection();

const openQueues: Array<Queue> = [];
const openWorkers: Array<Worker> = [];

export function createQueue(name: string): Queue {
  const queue = new Queue(name, { connection });
  openQueues.push(queue);
  return queue;
}

export function createWorker<T>(
  name: string,
  processor: Processor<T>
): Worker<T> {
  const worker = new Worker<T>(name, processor, { connection });
  openWorkers.push(worker);
  return worker;
}

export async function scheduleRepeatable(
  queue: Queue,
  jobName: string,
  cron: string
): Promise<void> {
  await queue.add(
    jobName,
    {},
    {
      repeat: { pattern: cron },
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );
}

export async function closeQueues(): Promise<void> {
  await Promise.all(openWorkers.map((worker) => worker.close()));
  await Promise.all(openQueues.map((queue) => queue.close()));
}
