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
import { ReportClosed } from "@/components/profile/report-closed";
import { StatusNotice } from "@/components/profile/status-notice";
import { PostCard } from "@/components/posts/post-card";
import { PostTypeFilter } from "@/components/posts/post-type-filter";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { getSession } from "@/lib/auth/session";
import { allowedRequest, roleFor } from "@/lib/business-status";
import { myOpenRequest } from "@/lib/data/business-requests";
import {
  findPublicBusiness,
  findVisibleBusiness,
  getBusiness,
} from "@/lib/data/businesses";
import { isFollowing } from "@/lib/data/follows";
import { businessPosts, businessPostTypes } from "@/lib/data/posts";
import { getReviewSummary } from "@/lib/data/reviews";
import { getTranslations } from "@/lib/i18n/server";
import { inLocale } from "@/lib/localized";
import { isPostType } from "@/lib/posts";
import { href } from "@/lib/routes";

export async function generateMetadata({
  params,
}: PageProps<"/bs/[username]">): Promise<Metadata> {
  const [{ locale }, { username }] = await Promise.all([
    getTranslations(),
    params,
  ]);
  const handle = decodeURIComponent(username);
  // Pending / suspended ones: only their people see them — never indexed.
  if (!(await findPublicBusiness(handle))) return { robots: { index: false } };
  const business = await getBusiness(handle);
  if (!business) return {};
  return {
    title: inLocale(business.name, locale),
    description: inLocale(business.bio, locale) || undefined,
    alternates: { canonical: href("business", { params: { username } }) },
  };
}

/**
 * A business's public profile, as a visitor sees it: follow/order, the
 * details card (reviews, hours, links, address, map), then its posts
 * (`?type=` filters them).
 */
export default async function BusinessPage({
  params,
  searchParams,
}: PageProps<"/bs/[username]">) {
  const [{ t, locale }, { username }, { type }, session] = await Promise.all([
    getTranslations(),
    params,
    searchParams,
    getSession(),
  ]);
  // `?type=` filters its posts.
  const postType = isPostType(type) ? type : null;
  const handle = decodeURIComponent(username);
  const [row, business] = await Promise.all([
    findVisibleBusiness(handle, session?.user),
    getBusiness(handle),
  ]);
  if (!row || !business) notFound();
  const userId = session?.user.id;
  const role = roleFor(row, session?.user);
  const canReport =
    allowedRequest(role ?? "visitor", row.status) === "close" &&
    role !== "creator";
  const [summary, following, openRequest, posts, postTypes] = await Promise.all(
    [
      getReviewSummary(row.id),
      userId ? isFollowing(userId, row.id) : false,
      userId && canReport ? myOpenRequest(row.id, userId) : null,
      businessPosts(row.id, userId, { type: postType ?? undefined }),
      businessPostTypes(row.id),
    ],
  );
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
          {row.status !== "active" && <StatusNotice status={row.status} />}
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

          {canReport && (
            <ReportClosed
              username={business.username}
              signedIn={!!userId}
              reported={openRequest === "close"}
            />
          )}
          {postTypes.length > 0 && (
            <section
              aria-labelledby="business-posts"
              className="flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 id="business-posts" className="text-lg font-bold">
                  {t("Posts")}
                </h2>
                <PostTypeFilter types={postTypes} value={postType} />
              </div>
              {posts.length === 0 && (
                <p className="rounded-2xl bg-card px-4 py-6 text-center text-sm text-muted-foreground ring-1 ring-foreground/5">
                  {t("No posts of this type yet.")}
                </p>
              )}
              <ul className="flex flex-col gap-3">
                {posts.map((post) => (
                  <li key={post.id}>
                    <PostCard post={post} signedIn={!!userId} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
      </PullToRefresh>
    </Screen>
  );
}
