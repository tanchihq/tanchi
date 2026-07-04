import type { ZodType } from "zod";
import { sendError } from "@shared/errors";
import type { Context } from "hono";

type ValidationResult<T extends ZodType> =
  | { success: true; data: T["_output"] }
  | {
      success: false;
      error: { issues: Array<{ message: string }> };
      data: T["_output"];
    };

export const zodValidationHook = <T extends ZodType>(
  result: ValidationResult<T>,
  c: Context
): Response | void => {
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Bad Request";
    return sendError(c, 400, message);
  }

  return undefined;
};
