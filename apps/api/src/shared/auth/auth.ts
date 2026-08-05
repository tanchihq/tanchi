import { betterAuth } from "better-auth";
import { openAPI, organization } from "better-auth/plugins";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";
import { captureEvent } from "@shared/analytics";
import { db } from "../../db.ts";
import {
  env,
  isBillingEnabled,
  isDevelopment,
  isEmailVerificationRequired,
} from "../../env.ts";
import {
  SOLO_ENTITLEMENTS,
  SOLO_PLAN_NAME,
  TRIAL_DURATION_DAYS,
} from "../billing/constants.ts";
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
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

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

async function getOrganizationOwnerId(
  organizationId: string
): Promise<string | null> {
  const rows = await db<ReadonlyArray<Readonly<{ user_id: string }>>>`
    SELECT user_id
    FROM member
    WHERE organization_id = ${organizationId}
      AND role IN ('owner', 'admin')
    ORDER BY created_at ASC
    LIMIT 1
  `;
  return rows[0]?.user_id ?? null;
}

async function captureSubscriptionEvent(
  organizationId: string,
  event: string,
  properties: Readonly<Record<string, string | number | boolean | null>>
): Promise<void> {
  const ownerId = await getOrganizationOwnerId(organizationId);
  if (ownerId === null) return;
  captureEvent({
    distinctId: ownerId,
    event,
    properties: { organizationId, ...properties },
  });
}

async function isOrganizationOwner(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const rows = await db<ReadonlyArray<Readonly<{ role: string }>>>`
    SELECT role
    FROM member
    WHERE user_id = ${userId} AND organization_id = ${organizationId}
    LIMIT 1
  `;
  const role = rows[0]?.role;
  return role === "owner" || role === "admin";
}

function buildStripePlugin() {
  const secretKey = env.STRIPE_SECRET_KEY;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  const soloPriceId = env.STRIPE_SOLO_PRICE_ID;
  if (
    !isBillingEnabled ||
    secretKey === undefined ||
    webhookSecret === undefined ||
    soloPriceId === undefined
  ) {
    return [];
  }
  return [
    stripe({
      stripeClient: new Stripe(secretKey),
      stripeWebhookSecret: webhookSecret,
      subscription: {
        enabled: true,
        requireEmailVerification: isEmailVerificationRequired,
        plans: [
          {
            name: SOLO_PLAN_NAME,
            priceId: soloPriceId,
            freeTrial: {
              days: TRIAL_DURATION_DAYS,
              onTrialStart: async (subscription) => {
                await captureSubscriptionEvent(
                  subscription.referenceId,
                  "trial_started",
                  { plan: subscription.plan }
                );
              },
            },
          },
        ],
        onSubscriptionUpdate: async ({ subscription }) => {
          if (subscription.status !== "active") return;
          await captureSubscriptionEvent(
            subscription.referenceId,
            "subscription_activated",
            { plan: subscription.plan }
          );
        },
        authorizeReference: ({ user, referenceId }) =>
          isOrganizationOwner(user.id, referenceId),
      },
    }),
  ];
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
    minPasswordLength: MIN_PASSWORD_LENGTH,
    maxPasswordLength: MAX_PASSWORD_LENGTH,
    requireEmailVerification: false,
    sendResetPassword: sendResetPasswordEmail,
  },
  emailVerification: {
    sendVerificationEmail,
    sendOnSignUp: isEmailVerificationRequired,
    sendOnSignIn: false,
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
      ...(isBillingEnabled
        ? { membershipLimit: SOLO_ENTITLEMENTS.seats }
        : {}),
    }),
    ...buildStripePlugin(),
    ...(isDevelopment ? [openAPI()] : []),
  ],
});

export type Auth = typeof auth;
export type Session = Auth["$Infer"]["Session"]["session"];
export type User = Auth["$Infer"]["Session"]["user"];
