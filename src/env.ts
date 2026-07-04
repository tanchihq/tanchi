import { z } from "zod";

const AUTH_SECRET_MIN_LENGTH = 32;

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.url(),
  APP_URL: z.url().default("http://localhost:5173"),
  AUTH_SECRET: z.string().min(AUTH_SECRET_MIN_LENGTH),
  AUTH_BASE_URL: z.url().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

export const isDevelopment = env.NODE_ENV === "development";
