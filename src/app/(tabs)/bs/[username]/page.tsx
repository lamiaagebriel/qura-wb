import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { BusinessHero } from "@/components/profile/business-hero";
import { fakeBusiness } from "@/components/profile/fake-businesses";
import { fakeReviews, summarize } from "@/components/profile/fake-reviews";
import { PROFILE_NAME_ID } from "@/components/profile/hero-parts";
import {
  ShareProfileButton,
  VisitorActions,
} from "@/components/profile/visitor-actions";
import { PullToRefresh } from "@/components/pull-to-refresh";
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
  const business = fakeBusiness(decodeURIComponent(username));
  if (!business) return {};
  return {
    title: inLocale(business.name, locale),
    description: inLocale(business.bio, locale) || undefined,
    alternates: { canonical: href("business", { params: { username } }) },
    // TEMPORARY: fake businesses stay out of search engines (and out of
    // app/sitemap.ts) until profiles come from the database.
    robots: { index: false, follow: true },
  };
}

/**
 * A business's public profile, as a visitor sees it: follow/order, and
 * the details card (reviews, hours, links, address, map).
 */
export default async function BusinessPage({
  params,
}: PageProps<"/bs/[username]">) {
  const [{ locale }, { username }] = await Promise.all([
    getTranslations(),
    params,
  ]);
  // TEMPORARY: fake data until profiles exist.
  const business = fakeBusiness(decodeURIComponent(username));
  if (!business) notFound();
  // Written by the owner; shown in the app language (English if missing).
  const name = inLocale(business.name, locale);
  const reviews = fakeReviews(business.username);
  const summary = summarize(reviews);

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
                <VisitorActions name={name} whatsapp={business.socials[0]} />
              }
            />
          </section>
        </main>
      </PullToRefresh>
    </Screen>
  );
}
