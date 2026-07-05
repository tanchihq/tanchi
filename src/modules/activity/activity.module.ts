import { db } from "../../db.ts";
import { ActivityPostgres } from "./repository/activity/activity.postgres.ts";
import { ActivityRepository } from "./repository/activity/activity.repository.ts";
import { ActivityService } from "./activity.service.ts";
import { createActivityRouter } from "./activity.controller.ts";

const activityRepository = new ActivityRepository(new ActivityPostgres(db));
const activityService = new ActivityService(activityRepository);

export const activityRouter = createActivityRouter(activityService);
