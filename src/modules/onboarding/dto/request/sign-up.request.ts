import { z } from "zod";
import { SignUpErrors } from "../../onboarding.errors.ts";
import {
  MAX_COMPANY_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_FIRST_NAME_LENGTH,
  MAX_LAST_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "../../onboarding.constants.ts";

export const SignUpDto = z.object({
  email: z
    .email({ error: SignUpErrors.invalidEmail })
    .max(MAX_EMAIL_LENGTH, { message: SignUpErrors.invalidEmail }),
  password: z
    .string({ error: SignUpErrors.invalidPassword })
    .min(MIN_PASSWORD_LENGTH, { message: SignUpErrors.invalidPassword })
    .max(MAX_PASSWORD_LENGTH, { message: SignUpErrors.invalidPassword }),
  firstName: z
    .string({ error: SignUpErrors.invalidFirstName })
    .trim()
    .min(1, { message: SignUpErrors.invalidFirstName })
    .max(MAX_FIRST_NAME_LENGTH, { message: SignUpErrors.invalidFirstName }),
  lastName: z
    .string({ error: SignUpErrors.invalidLastName })
    .trim()
    .min(1, { message: SignUpErrors.invalidLastName })
    .max(MAX_LAST_NAME_LENGTH, { message: SignUpErrors.invalidLastName }),
  company: z
    .string({ error: SignUpErrors.invalidCompany })
    .trim()
    .min(1, { message: SignUpErrors.invalidCompany })
    .max(MAX_COMPANY_LENGTH, { message: SignUpErrors.invalidCompany }),
});

export type SignUpDto = z.infer<typeof SignUpDto>;
