import { BillingService } from "./billing.service.ts";
import { createBillingRouter } from "./billing.controller.ts";

const billingService = new BillingService();

export const billingRouter = createBillingRouter(billingService);
