import { z } from "zod";
import { ImportSuppressionErrors } from "../../suppression.errors.ts";
import { MAX_CSV_SIZE_BYTES } from "../../suppression.constants.ts";

export const ImportSuppressionDto = z.object({
  file: z
    .instanceof(File, { message: ImportSuppressionErrors.invalidFile })
    .refine((file) => file.size > 0 && file.size <= MAX_CSV_SIZE_BYTES, {
      message: ImportSuppressionErrors.invalidFile,
    }),
});

export type ImportSuppressionDto = z.infer<typeof ImportSuppressionDto>;
