import "server-only";

import { and, asc, count, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { db } from "@/db";
import {
  businesses,
  businessHours,
  businessLinks,
  businessLocations,
  follows,
  type Business,
} from "@/db/schema";
import type {
  BusinessProfile,
  BusinessSummary,
  OpeningHours,
} from "@/lib/business";
import { ALL_CATEGORIES, pathOf, subtreeOf } from "@/lib/categories";

/**
 * Tag on every cached business read. A write that changes businesses
 * (save, delete, verify) revalidates it.
 */
export const BUSINESSES_TAG = "businesses";

const SEARCH_LIMIT = 50;

/** Shown to visitors: not suspended by an admin. */
const listed = isNull(businesses.suspendedAt);

const summaryColumns = {
  name: businesses.name,
  username: businesses.username,
  category: businesses.category,
  verified: businesses.verified,
  avatarUrl: businesses.image,
};

/** "08:00:00" → "08:00" (Postgres returns seconds). */
const hhmm = (time: string) => time.slice(0, 5);

/** Everything a business's page shows, in the shape the screens use. */
async function toProfile(business: Business): Promise<BusinessProfile> {
  const [locations, links, hours, [followers]] = await Promise.all([
    db
      .select()
      .from(businessLocations)
      .where(eq(businessLocations.businessId, business.id))
      .orderBy(asc(businessLocations.position)),
    db
      .select()
      .from(businessLinks)
      .where(eq(businessLinks.businessId, business.id))
      .orderBy(asc(businessLinks.position)),
    db
      .select()
      .from(businessHours)
      .where(eq(businessHours.businessId, business.id)),
    db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.businessId, business.id)),
  ]);

  const week: (OpeningHours | null)[] = Array.from({ length: 7 }, () => null);
  for (const { day, opens, closes } of hours)
    week[day] = { open: hhmm(opens), close: hhmm(closes) };

  return {
    username: business.username,
    avatarUrl: business.image,
    verified: business.verified,
    name: business.name,
    bio: business.bio,
    category: business.category,
    // The save action guarantees at least one location and one WhatsApp.
    locations: locations.map(({ address, lat, lng }) => ({
      description: address,
      coords: { lat, lng },
    })) as BusinessProfile["locations"],
    socials: links.map(({ platform, url }) => ({
      platform,
      url,
    })) as BusinessProfile["socials"],
    hours: week,
    timeZone: business.timeZone,
    stats: { followers: followers.count },
  };
}

/**
 * The business's row (id, owner, creator…), or `undefined` if no business
 * has this @handle. Deduplicated per request.
 */
export const findBusiness = cache(async (username: string) => {
  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.username, username))
    .limit(1);
  return business;
});

/**
 * A business visitors can see: `undefined` if no business has this
 * or an admin suspended it. Public pages and actions use this one.
 */
export const findPublicBusiness = async (username: string) => {
  const business = await findBusiness(username);
  return business?.suspendedAt ? undefined : business;
};

/** Whether this user owns or added the business (can't review it). */
export const isMine = (business: Business, userId: string | undefined) =>
  !!userId && (business.ownerId === userId || business.createdById === userId);

/**
 * A business's public page, or `undefined` if there's none to show (see
 * `findPublicBusiness`). Deduplicated per request (metadata + page).
 */
export const getBusiness = cache(async (username: string) => {
  const business = await findPublicBusiness(username);
  return business && toProfile(business);
});

/** The businesses you own or added (Profile → My businesses). */
export async function getMyBusinesses(
  userId: string,
): Promise<BusinessSummary[]> {
  return db
    .select(summaryColumns)
    .from(businesses)
    .where(
      or(eq(businesses.ownerId, userId), eq(businesses.createdById, userId)),
    )
    .orderBy(asc(businesses.createdAt));
}

/**
 * One of your businesses (to edit) and your part in it, or `undefined` if
 * it doesn't exist or you neither own nor added it.
 */
export async function getMyBusiness(username: string, userId: string) {
  const business = await findBusiness(username);
  if (!business) return undefined;
  const ownedByMe = business.ownerId === userId;
  const createdByMe = business.createdById === userId;
  if (!ownedByMe && !createdByMe) return undefined;
  return {
    id: business.id,
    business: await toProfile(business),
    ownedByMe,
    createdByMe,
  };
}

/** Businesses in category `slug` or anywhere under it. */
export async function businessesIn(slug: string): Promise<BusinessSummary[]> {
  return db
    .select(summaryColumns)
    .from(businesses)
    .where(and(listed, inArray(businesses.category, [...subtreeOf(slug)])))
    .orderBy(asc(businesses.createdAt));
}

/**
 * How many businesses each category has, counting its whole subtree.
 * Cached across requests; refreshed when `BUSINESSES_TAG` is revalidated
 * (a save) or after an hour.
 */
export const categoryCounts = unstable_cache(
  async (): Promise<Record<string, number>> => {
    const rows = await db
      .select({ category: businesses.category, count: count() })
      .from(businesses)
      .where(listed)
      .groupBy(businesses.category);
    const counts: Record<string, number> = {};
    for (const row of rows)
      for (const c of pathOf(row.category))
        counts[c.slug] = (counts[c.slug] ?? 0) + row.count;
    return counts;
  },
  ["category-counts"],
  // Hourly too: admin changes (`pnpm admin`) happen outside the app.
  { tags: [BUSINESSES_TAG], revalidate: 3600 },
);

/** `%` and `_` typed by the user match themselves, not anything. */
const likePattern = (query: string) =>
  `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

/** A localized column's text in every language, as one string. */
const allLanguages = (column: typeof businesses.name | typeof businesses.bio) =>
  sql`concat_ws(' ', ${column}->>'en', ${column}->>'ar', ${column}->>'fr')`;

/**
 * Businesses whose name, @handle or description (in any language) contains
 * `query`, or whose category or a parent of it matches ("salon" finds nail
 * bars too). Plain `ILIKE` for now; add a pg_trgm index at real volume.
 */
export async function searchBusinesses(
  query: string,
): Promise<BusinessSummary[]> {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return [];
  const pattern = likePattern(q);

  // Categories live in code: match their names here, then filter by slug.
  const slugs = new Set<string>();
  for (const category of ALL_CATEGORIES)
    if (
      Object.values(category.name).some((name) =>
        name.toLocaleLowerCase().includes(q),
      )
    )
      for (const slug of subtreeOf(category.slug)) slugs.add(slug);

  return db
    .select(summaryColumns)
    .from(businesses)
    .where(
      and(
        listed,
        or(
          sql`${allLanguages(businesses.name)} ilike ${pattern}`,
          sql`${businesses.username} ilike ${pattern}`,
          sql`${allLanguages(businesses.bio)} ilike ${pattern}`,
          slugs.size ? inArray(businesses.category, [...slugs]) : undefined,
        ),
      ),
    )
    .orderBy(asc(businesses.createdAt))
    .limit(SEARCH_LIMIT);
}

/** Every listed business's @handle and last change (for the sitemap). */
export async function allBusinessHandles() {
  return db
    .select({ username: businesses.username, updatedAt: businesses.updatedAt })
    .from(businesses)
    .where(listed);
}
