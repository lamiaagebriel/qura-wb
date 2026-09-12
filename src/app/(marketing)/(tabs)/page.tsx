import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";
import { FeedComposeTrigger } from "@/components/feed-compose-trigger";
import { FeedThreadList } from "@/components/feed-thread-list";
import { HomeHeader } from "@/components/home-header";
import { getActiveCity } from "@/lib/city/actions";
import { CITY_LABEL, isCityAvailable } from "@/lib/city/cities";
import { getCurrentUser } from "@/lib/auth/guard";
import { getMyBusinesses } from "@/lib/business/queries";
import { getActiveIdentity } from "@/lib/identity/active";
import { getLocale } from "@/lib/i18n/actions";
import { getFeedThreads } from "@/lib/threads/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return {
    title: `${t("Feed")} — Qura`,
    description: t("Find trusted businesses and services around you."),
  };
}

export default async function FeedPage() {
  const [user, { t }, city] = await Promise.all([
    getCurrentUser(),
    getLocale(),
    getActiveCity(),
  ]);
  // Same "post as" data `BottomNav`'s `NewThreadButton` gets — the feed's
  // own compose row is a second entry point into the exact same sheet,
  // not a separate flow, so it needs the same inputs.
  const [businesses, identity] = await Promise.all([
    user ? getMyBusinesses(user.id) : Promise.resolve([]),
    user ? getActiveIdentity() : Promise.resolve(null),
  ]);
  const available = isCityAvailable(city);
  // Skip the query entirely when the city has no content yet — an empty
  // result would render the same generic "no threads yet" the feed shows
  // an actual empty city, which isn't what's going on here.
  //
  // `"latest"` explicitly, matching `FeedThreadList`'s own client-side
  // default — leaving this unspecified used to fall back to
  // `getFeedThreads`'s "relevant" (vote-ranked) default, a different
  // order than every subsequent "load more" page, which is what made a
  // freshly posted thread (0 votes) land wherever its 0-vote rank
  // happened to fall instead of at the very top.
  const { items, nextCursor } = available
    ? await getFeedThreads(city, user?.id, 0, "latest")
    : { items: [], nextCursor: null };

  return (
    <div className="flex flex-col">
      {/* The home screen leads with location/greeting/search, not a bare
          title bar — see `HomeHeader`'s own comment. */}
      <HomeHeader name={user?.name} activeCity={city} />

      <div className="flex flex-col gap-2 py-2">
        {available && (
          <FeedComposeTrigger
            user={user}
            businesses={businesses}
            defaultPostAsId={identity?.isBusiness ? identity.id : undefined}
          />
        )}

        {available ? (
          // Keyed on `city` — switching cities has to drop whatever this
          // list already loaded via scrolling (`useInfiniteList` would
          // otherwise merge the old city's items back in alongside the
          // new ones, the same reason `ThreadList` keys on `userId`), not
          // just prepend the new city's first page on top of them.
          <FeedThreadList
            key={city}
            initialItems={items}
            initialCursor={nextCursor}
            currentUserId={user?.id}
            emptyLabel={t("No threads yet. Be the first to post.")}
          />
        ) : (
          <ComingSoon
            title={t(CITY_LABEL[city])}
            description={t("Coming soon")}
          />
        )}
      </div>
    </div>
  );
}
