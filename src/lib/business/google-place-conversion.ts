import "server-only";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { BUSINESS_CATEGORIES, CITIES, type BusinessCategory, type CityId } from "@/db/schema";
import { isPlausibleGooglePlaceId } from "@/lib/business/google-place-id";
import {
  findExistingConnectedBusiness,
  recordDuplicateConnection,
} from "@/lib/business/google-place-claims";
import { getMyBusinessConnectedToPlace } from "@/lib/business/queries";
import { fail, issueError, messageError, ok, zodIssuesError, type ActionResult } from "@/lib/errors";
import { createBusinessSchema, type BusinessValues } from "@/lib/validations/business";
import type { Dict } from "@/lib/i18n/config";

type Translate = (key: keyof Dict) => string;

/**
 * The two `createBusinessFromGooglePlaceAction`/`checkGooglePlaceConversionAction`
 * server actions are thin wrappers around these — `getGuardedUser()` needs
 * a live Next.js request scope (`next/headers`), which a real-Postgres
 * test harness run via plain `tsx` doesn't have (same limitation
 * `evaluate-discovery.ts` already documents for `searchUnified`). Hoisting
 * the auth check out to the action layer and taking `ownerId` as a plain
 * parameter here means everything below IS exercisable against a real
 * database outside a request — see `evaluate-google-place-conversion.ts`.
 */

export async function checkExistingGooglePlaceConversion(
  ownerId: string,
  placeId: string,
): Promise<{ id: string; username: string } | null> {
  return getMyBusinessConnectedToPlace(ownerId, placeId.trim());
}

export type CreateBusinessFromGooglePlaceInput = {
  googlePlace: {
    placeId: string;
    name: string;
    address?: string;
    location?: { latitude: number; longitude: number };
    types: string[];
  };
  name: string;
  username: string;
  bio?: string;
  category: BusinessCategory;
  city: CityId;
};

export type CreateBusinessFromGooglePlaceData =
  | { status: "created"; id: string; username: string; conflict: boolean }
  | { status: "already_connected"; id: string; username: string };

export async function createBusinessFromGooglePlace(
  ownerId: string,
  input: CreateBusinessFromGooglePlaceInput,
  t: Translate,
): Promise<ActionResult<CreateBusinessFromGooglePlaceData>> {
  const trimmedPlaceId = input.googlePlace.placeId.trim();
  if (!isPlausibleGooglePlaceId(trimmedPlaceId)) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  if (!BUSINESS_CATEGORIES.includes(input.category)) {
    return fail(issueError(["category"], t("Choose a category.")));
  }
  if (!CITIES.includes(input.city)) {
    return fail(issueError(["city"], t("Choose a city.")));
  }

  const parsed = createBusinessSchema(t).safeParse({
    name: input.name,
    username: input.username,
    bio: input.bio,
  } satisfies BusinessValues);
  if (!parsed.success) return fail(zodIssuesError(parsed.error));

  const username = parsed.data.username.toLowerCase();

  const alreadyOwned = await getMyBusinessConnectedToPlace(ownerId, trimmedPlaceId);
  if (alreadyOwned) {
    return ok({ status: "already_connected", ...alreadyOwned });
  }

  const usernameTaken = await db.query.users.findFirst({
    where: eq(schema.users.username, username),
    columns: { id: true },
  });
  if (usernameTaken) {
    return fail(issueError(["username"], t("That username is already taken.")));
  }

  const location = input.googlePlace.address
    ? {
        description: input.googlePlace.address,
        ...(input.googlePlace.location
          ? {
              lat: input.googlePlace.location.latitude,
              lng: input.googlePlace.location.longitude,
            }
          : {}),
      }
    : undefined;

  let created: { id: string; username: string };
  try {
    created = await db.transaction(async (tx) => {
      const [business] = await tx
        .insert(schema.users)
        .values({
          ownerId,
          name: parsed.data.name,
          username,
          bio: parsed.data.bio || null,
          email: `business+${randomUUID()}@business.internal.qura`,
          emailVerified: true,
          status: "active",
        })
        .returning({ id: schema.users.id, username: schema.users.username });

      if (!business) throw new Error("business_insert_failed");

      await tx.insert(schema.businessBlocks).values({
        businessId: business.id,
        category: input.category,
        city: input.city,
        data: location ? { location } : {},
      });

      // Phase 24: connections live in their own table (`business_google_places`,
      // one row per branch) rather than a column on `business_blocks` —
      // still written in this same transaction, so a business is never
      // left half-created (block with no connection, or vice versa).
      await tx.insert(schema.businessGooglePlaces).values({
        businessId: business.id,
        googlePlaceId: trimmedPlaceId,
      });

      return business;
    });
  } catch {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  const existing = await findExistingConnectedBusiness(trimmedPlaceId, created.id);
  let conflict = false;
  if (existing) {
    await recordDuplicateConnection({
      googlePlaceId: trimmedPlaceId,
      attemptingBusinessId: created.id,
      attemptingOwnerId: ownerId,
      existingBusinessId: existing.businessId,
      existingOwnerId: existing.business.ownerId!,
    });
    conflict = true;
  }

  return ok({ status: "created", id: created.id, username: created.username, conflict });
}
