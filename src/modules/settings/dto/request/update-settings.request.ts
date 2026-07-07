import { z } from "zod";
import { UpdateSettingsErrors } from "../../settings.errors.ts";
import {
  MAX_COMPANY_NAME_LENGTH,
  MAX_COMPANY_PROFILE_LENGTH,
  MAX_FOLLOW_UP_INTERVAL_DAYS,
  MAX_FOLLOW_UPS,
  MAX_ICP_DESCRIPTION_LENGTH,
  MAX_ICP_NAME_LENGTH,
  MAX_ICP_SHORT_FIELD_LENGTH,
  MAX_ICPS,
  MAX_URL_LENGTH,
} from "../../settings.constants.ts";
const websiteSchema = z
  .url({ error: UpdateSettingsErrors.invalidWebsite })
  .max(MAX_URL_LENGTH, { message: UpdateSettingsErrors.invalidWebsite });

const optionalResourceUrlSchema = z
  .url({ error: UpdateSettingsErrors.invalidResource })
  .max(MAX_URL_LENGTH, { message: UpdateSettingsErrors.invalidResource })
  .nullish();

const shortIcpField = z
  .string({ error: UpdateSettingsErrors.invalidIcp })
  .trim()
  .max(MAX_ICP_SHORT_FIELD_LENGTH, {
    message: UpdateSettingsErrors.invalidIcp,
  });

const icpSchema = z.object({
  name: z
    .string({ error: UpdateSettingsErrors.invalidIcp })
    .trim()
    .min(1, { message: UpdateSettingsErrors.invalidIcp })
    .max(MAX_ICP_NAME_LENGTH, { message: UpdateSettingsErrors.invalidIcp }),
  archetype: shortIcpField,
  description: z
    .string({ error: UpdateSettingsErrors.invalidIcp })
    .trim()
    .min(1, { message: UpdateSettingsErrors.invalidIcp })
    .max(MAX_ICP_DESCRIPTION_LENGTH, {
      message: UpdateSettingsErrors.invalidIcp,
    }),
  perceivedValue: shortIcpField,
  angle: shortIcpField,
  goldenRule: shortIcpField,
});

export const UpdateSettingsDto = z.object({
  company: z.object({
    name: z
      .string({ error: UpdateSettingsErrors.invalidCompanyName })
      .trim()
      .min(1, { message: UpdateSettingsErrors.invalidCompanyName })
      .max(MAX_COMPANY_NAME_LENGTH, {
        message: UpdateSettingsErrors.invalidCompanyName,
      }),
    website: websiteSchema,
  }),
  resources: z.object({
    productPageUrl: optionalResourceUrlSchema,
    salesDeckUrl: optionalResourceUrlSchema,
  }),
  outreachLanguage: z
    .string({ error: UpdateSettingsErrors.invalidLanguage })
    .trim()
    .min(2, { message: UpdateSettingsErrors.invalidLanguage })
    .max(10, { message: UpdateSettingsErrors.invalidLanguage }),
  companyProfile: z
    .string({ error: UpdateSettingsErrors.invalidCompanyProfile })
    .max(MAX_COMPANY_PROFILE_LENGTH, {
      message: UpdateSettingsErrors.invalidCompanyProfile,
    })
    .default(""),
  followUp: z.object({
    intervals: z
      .array(
        z
          .number({ error: UpdateSettingsErrors.invalidFollowUp })
          .int({ message: UpdateSettingsErrors.invalidFollowUp })
          .min(1, { message: UpdateSettingsErrors.invalidFollowUp })
          .max(MAX_FOLLOW_UP_INTERVAL_DAYS, {
            message: UpdateSettingsErrors.invalidFollowUp,
          }),
        { error: UpdateSettingsErrors.invalidFollowUp }
      )
      .min(1, { message: UpdateSettingsErrors.invalidFollowUp })
      .max(MAX_FOLLOW_UPS, { message: UpdateSettingsErrors.invalidFollowUp }),
    excludedWeekdays: z
      .array(
        z
          .number({ error: UpdateSettingsErrors.invalidFollowUp })
          .int({ message: UpdateSettingsErrors.invalidFollowUp })
          .min(0, { message: UpdateSettingsErrors.invalidFollowUp })
          .max(6, { message: UpdateSettingsErrors.invalidFollowUp }),
        { error: UpdateSettingsErrors.invalidFollowUp }
      )
      .max(7, { message: UpdateSettingsErrors.invalidFollowUp }),
  }),
  icps: z
    .array(icpSchema, { error: UpdateSettingsErrors.invalidIcp })
    .min(1, { message: UpdateSettingsErrors.invalidIcp })
    .max(MAX_ICPS, { message: UpdateSettingsErrors.tooManyIcps }),
});

export type UpdateSettingsDto = z.infer<typeof UpdateSettingsDto>;
