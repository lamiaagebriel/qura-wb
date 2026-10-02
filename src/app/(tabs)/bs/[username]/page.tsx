import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { BusinessHero } from "@/components/profile/business-hero";
import { PROFILE_NAME_ID } from "@/components/profile/hero-parts";
import {
  ShareProfileButton,
  VisitorActions,
} from "@/components/profile/visitor-actions";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { getSession } from "@/lib/auth/session";
import { findPublicBusiness, getBusiness } from "@/lib/data/businesses";
import { isFollowing } from "@/lib/data/follows";
import { getReviewSummary } from "@/lib/data/reviews";
import { getTranslations } from "@/lib/i18n/server";
import { inLocale } from "@/lib/localized";
import { href } from "@/lib/routes";

export async function generateMetadata({
  params,
}: PageProps<"/bs/[username]">): Promise<Metadata> {
  const [{ locale }, { username }] = await Promise.all([
    getTranslations(),
    params,
  ]);
  const business = await getBusiness(decodeURIComponent(username));
  if (!business) return {};
  return {
    title: inLocale(business.name, locale),
    description: inLocale(business.bio, locale) || undefined,
    alternates: { canonical: href("business", { params: { username } }) },
  };
}

/**
 * A business's public profile, as a visitor sees it: follow/order, and
 * the details card (reviews, hours, links, address, map).
 */
export default async function BusinessPage({
  params,
}: PageProps<"/bs/[username]">) {
  const [{ locale }, { username }, session] = await Promise.all([
    getTranslations(),
    params,
    getSession(),
  ]);
  const handle = decodeURIComponent(username);
  const [row, business] = await Promise.all([
    findPublicBusiness(handle),
    getBusiness(handle),
  ]);
  if (!row || !business) notFound();
  const userId = session?.user.id;
  const [summary, following] = await Promise.all([
    getReviewSummary(row.id),
    userId ? isFollowing(userId, row.id) : false,
  ]);
  // Written by the owner; shown in the app language (English if missing).
  const name = inLocale(business.name, locale);

  return (
    <Screen>
      <AppHeader
        title={name}
        back={href("search")}
        // The name is already big on the page; the bar shows it once that
        // has scrolled away.
        titleAfter={PROFILE_NAME_ID}
        action={<ShareProfileButton name={name} username={business.username} />}
      />
      <PullToRefresh>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 pb-8">
          <section aria-label={name} className="flex flex-col gap-4 pt-2">
            <BusinessHero
              profile={business}
              rating={summary}
              actions={
                <VisitorActions
                  name={name}
                  username={business.username}
                  whatsapp={business.socials[0]}
                  signedIn={!!userId}
                  following={following}
                />
              }
            />
          </section>
        </main>
      </PullToRefresh>
    </Screen>
  );
}
