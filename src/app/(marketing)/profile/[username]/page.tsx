import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Call02Icon,
  GlobalIcon,
  MapsLocation01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShareButton } from "@/components/share-button";
import { AppHeader } from "@/components/app-header";
import {
  getBusinessBlock,
  getBusinessGooglePlaceResults,
  getBusinessRatingSummary,
} from "@/lib/business/queries";
import { mergeRatingSummary } from "@/lib/business/rating";
import { CATEGORY_META } from "@/lib/categories";
import { getCurrentUser } from "@/lib/auth/guard";
import { getLocale } from "@/lib/i18n/actions";
import { googleMapsUrl, type Location } from "@/lib/location";
import {
  getFollowCounts,
  getUserByUsername,
  isFollowing,
} from "@/lib/profile/queries";
import { detectSocialPlatform } from "@/lib/social";

import { ProfileTabs } from "@/app/(marketing)/(tabs)/profile-tabs";
import { ProfileFollowStats } from "./follow-profile-button";

// Google's documented "Search" deep-link format — `query_place_id`
// alongside `query` pins the map on this EXACT place rather than
// re-running a text search. No API key needed. Kept local, same as
// every other place this pattern already lives in this codebase
// (`search-view.tsx`, `category-results.tsx`).
function googleMapsPlaceUrl(placeId: string, name: string): string {
  const params = new URLSearchParams({
    api: "1",
    query: name,
    query_place_id: placeId,
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

type ProfilePageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);
  return { title: user ? `${user.name} (@${user.username}) — Qura` : "Qura" };
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const [viewer, { t, locale }, profileUser] = await Promise.all([
    getCurrentUser(),
    getLocale(),
    getUserByUsername(username),
  ]);

  if (!profileUser) notFound();

  // Your own public profile URL is just your own profile — send you to the
  // richer `/account` view (Edit/Settings, no Follow button) instead of
  // duplicating it here.
  if (viewer?.id === profileUser.id) {
    redirect("/account");
  }

  const [{ followers, following }, alreadyFollowing, block, ratingSummary] =
    await Promise.all([
      getFollowCounts(profileUser.id),
      viewer ? isFollowing(viewer.id, profileUser.id) : Promise.resolve(false),
      profileUser.ownerId
        ? getBusinessBlock(profileUser.id)
        : Promise.resolve(null),
      profileUser.ownerId
        ? getBusinessRatingSummary(profileUser.id)
        : Promise.resolve({ average: null, count: 0 }),
    ]);
  // Zero Google requests for a non-business profile or a business with no
  // connections — `getBusinessGooglePlaceResults` returns `[]` cheaply
  // before ever touching `lib/google-places/`.
  const googlePlaceResults = profileUser.ownerId
    ? await getBusinessGooglePlaceResults(profileUser.id, locale)
    : [];

  const shareUrl = `${process.env.APP_URL ?? ""}/profile/${profileUser.username}`;
  const isBusiness = !!profileUser.ownerId;

  // Same resolution the business-profile action row used before: Qura's
  // own data first, Google's connected place filling in whatever Qura
  // hasn't set. `blockData` is loosely typed on purpose — `business_blocks.data`
  // is a per-category jsonb blob (`lib/validations/business-block.ts`),
  // but `phones`/`socialLinks`/`location` are the one shape every
  // category shares.
  const blockData = block?.data as
    | { phones?: string[]; socialLinks?: string[]; location?: Location }
    | undefined;
  const firstGooglePlace = googlePlaceResults.find(
    (r) => r.result.status !== "unavailable",
  );
  const googleDetails =
    firstGooglePlace && firstGooglePlace.result.status !== "unavailable"
      ? firstGooglePlace.result.details
      : undefined;

  // One combined rating for the header — same inputs, same formula as
  // `ProfileTabs`'s Reviews tab (`mergeRatingSummary`), so the two never
  // show different numbers for the same business.
  const combinedRating = mergeRatingSummary(ratingSummary, googleDetails);

  const actionPhone = blockData?.phones?.[0] ?? googleDetails?.phoneNumber;
  const actionWebsite =
    blockData?.socialLinks?.find(
      (link) => detectSocialPlatform(link).label === "Website",
    ) ?? googleDetails?.websiteUri;
  // Falls through to Google's own coordinates whenever the Qura-computed
  // URL comes back `null` (e.g. a location with a description but no
  // lat/lng), not only when there's no Qura location set at all.
  const actionDirectionsUrl =
    (blockData?.location ? googleMapsUrl(blockData.location) : null) ??
    (firstGooglePlace
      ? googleMapsPlaceUrl(firstGooglePlace.googlePlaceId, profileUser.name)
      : undefined);

  // The Directions/Call/Website tiles — static, server-rendered, and
  // handed to `ProfileFollowStats` as `actionTiles` so Follow/Edit (which
  // needs client state) can render as the FIRST tile in this exact same
  // row instead of a separate button above it.
  const actionTiles = isBusiness && (
    <>
      {actionDirectionsUrl && (
        <a
          href={actionDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-foreground text-background flex flex-1 flex-col items-center gap-1.5 rounded-xl py-2.5"
        >
          <HugeiconsIcon icon={MapsLocation01Icon} className="size-4.5" />
          <span className="text-[10.5px] font-semibold">{t("Directions")}</span>
        </a>
      )}
      {actionPhone && (
        <a
          href={`tel:${actionPhone}`}
          className="bg-muted flex flex-1 flex-col items-center gap-1.5 rounded-xl py-2.5"
        >
          <HugeiconsIcon icon={Call02Icon} className="text-foreground size-4.5" />
          <span className="text-foreground text-[10.5px] font-semibold">
            {t("Call")}
          </span>
        </a>
      )}
      {actionWebsite && (
        <a
          href={actionWebsite}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-muted flex flex-1 flex-col items-center gap-1.5 rounded-xl py-2.5"
        >
          <HugeiconsIcon icon={GlobalIcon} className="text-foreground size-4.5" />
          <span className="text-foreground text-[10.5px] font-semibold">
            {t("Website")}
          </span>
        </a>
      )}
    </>
  );

  return (
    <div className="flex flex-col">
      {/* Reachable from lots of places (search, a thread's author link,
          a followers list, ...) with no single real "parent" — `/` is a
          safe, always-meaningful fallback rather than trusting browser
          history, which a fresh tab or a shared link has none of. */}
      <AppHeader
        title={`@${profileUser.username}`}
        action={
          <ShareButton
            url={shareUrl}
            shareTitle={profileUser.name}
            copiedToast={t("Profile link copied to clipboard.")}
            variant="ghost"
            size="icon-sm"
            aria-label={t("Share profile")}
          />
        }
      />
      <div className="flex flex-col gap-5">
        {/* A colored identity banner, not a fabricated photo — there's no
          gallery/cover-image field anywhere in the data model
          (`business_blocks` has no photo column), so rather than invent
          one, the business's own category icon becomes the visual, the
          same way `PlaceResultCard`'s avatar circle already does
          elsewhere in the app. */}
        {isBusiness && block && (
          <div className="from-primary to-primary/70 relative flex h-32 items-center justify-center overflow-hidden bg-linear-to-br">
            <HugeiconsIcon
              icon={CATEGORY_META[block.category].icon}
              className="text-primary-foreground/25 size-20"
              strokeWidth={1.3}
            />
          </div>
        )}

        <div className="container flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-foreground text-[20px] font-bold tracking-tight">
                {profileUser.name}
              </h2>
              {isBusiness && block && (
                <div className="text-primary flex items-center gap-1 text-[11px] font-bold">
                  <HugeiconsIcon icon={SparklesIcon} className="size-3" />
                  {t("Qura Profile")}
                </div>
              )}
              {block && (
                <p className="text-muted-foreground text-[12.5px]">
                  {[
                    t(CATEGORY_META[block.category].label),
                    combinedRating.count > 0
                      ? `★ ${combinedRating.average!.toFixed(1)} (${combinedRating.count})`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {profileUser.bio && (
                <p className="text-foreground text-[13.5px] leading-relaxed whitespace-pre-line">
                  {profileUser.bio}
                </p>
              )}
            </div>

            <Avatar size="lg" className="size-20!">
              <AvatarImage src={profileUser.image!} alt={profileUser.name} />
              <AvatarFallback>{profileUser.name}</AvatarFallback>
            </Avatar>
          </div>

          <ProfileFollowStats
            initialFollowerCount={followers}
            followingCount={following}
            isBusiness={!!profileUser.ownerId}
            userId={profileUser.id}
            initialIsFollowing={alreadyFollowing}
            isSignedIn={!!viewer}
            ownerBusinessId={
              profileUser.ownerId && profileUser.ownerId === viewer?.id
                ? profileUser.id
                : undefined
            }
            actionTiles={actionTiles}
          />
        </div>

        <ProfileTabs
          userId={profileUser.id}
          currentUserId={viewer?.id}
          stickyTop={50}
          isBusiness={!!profileUser.ownerId}
          canReview={!!viewer && profileUser.ownerId !== viewer.id}
          viewer={viewer}
          googlePlaceResults={googlePlaceResults}
          block={
            block
              ? {
                  category: block.category,
                  data: block.data as Record<string, unknown>,
                }
              : null
          }
        />
      </div>
    </div>
  );
}
