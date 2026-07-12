import { betterAuth } from "better-auth";
import { openAPI, organization } from "better-auth/plugins";
import { db } from "../../db.ts";
import { env, isDevelopment } from "../../env.ts";
import { postgresAdapter } from "./adapter.ts";
import {
  sendChangeEmailConfirmation,
  sendOrganizationInvitationEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "./emails.ts";

const SESSION_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;
const SESSION_UPDATE_AGE_SECONDS = 60 * 60 * 24;
const COOKIE_CACHE_MAX_AGE_SECONDS = 60 * 5;

async function resolveActiveOrganizationId(
  userId: string
): Promise<string | undefined> {
  const rows = await db<
    ReadonlyArray<Readonly<{ organization_id: string }>>
  >`
    SELECT organization_id
    FROM member
    WHERE user_id = ${userId}
    ORDER BY created_at ASC
    LIMIT 1
  `;
  return rows[0]?.organization_id;
}

export const auth = betterAuth({
  appName: "tanchi-api",
  baseURL: env.AUTH_BASE_URL,
  basePath: "/api/v1/auth",
  secret: env.AUTH_SECRET,
  trustedOrigins: [env.APP_URL],
  database: postgresAdapter(db),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION === "true",
    sendResetPassword: sendResetPasswordEmail,
  },
  emailVerification: {
    sendVerificationEmail,
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },
  user: {
    additionalFields: {
      firstName: { type: "string", required: true, input: true },
      lastName: { type: "string", required: true, input: true },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation,
    },
  },
  session: {
    expiresIn: SESSION_EXPIRES_IN_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
    cookieCache: {
      enabled: true,
      maxAge: COOKIE_CACHE_MAX_AGE_SECONDS,
    },
  },
  advanced: {
    cookiePrefix: "tanchi",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: !isDevelopment,
      path: "/",
    },
    useSecureCookies: !isDevelopment,
    database: {
      generateId: "uuid",
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const activeOrganizationId = await resolveActiveOrganizationId(
            session.userId
          );
          if (activeOrganizationId === undefined) return { data: session };
          return {
            data: {
              ...session,
              activeOrganizationId,
            },
          };
        },
      },
    },
  },
  plugins: [
    organization({
      sendInvitationEmail: sendOrganizationInvitationEmail,
    }),
    ...(isDevelopment ? [openAPI()] : []),
  ],
});

export type Auth = typeof auth;
export type Session = Auth["$Infer"]["Session"]["session"];
export type User = Auth["$Infer"]["Session"]["user"];
