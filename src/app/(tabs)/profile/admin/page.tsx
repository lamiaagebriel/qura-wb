import type { Metadata } from "next";
import type { ReactNode } from "react";

import {
  AdminStatusControls,
  RequestControls,
} from "@/components/admin/admin-controls";
import { AppHeader } from "@/components/app-header";
import { BusinessStatusBadge } from "@/components/business-status-badge";
import { CheckmarkCircle02Icon } from "@/components/icons";
import { StackLink } from "@/components/navigation/stack-link";
import { Screen } from "@/components/navigation/screen";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { StatusScreen } from "@/components/status-screen";
import { requireAdmin } from "@/lib/auth/session";
import type { BusinessSummary } from "@/lib/business";
import { openRequests, type OpenRequest } from "@/lib/data/business-requests";
import { businessesWithStatus } from "@/lib/data/businesses";
import { timeAgo } from "@/lib/format";
import { getTranslations } from "@/lib/i18n/server";
import { inLocale } from "@/lib/localized";
import { href } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("Admin"), robots: { index: false } };
}

/**
 * Admins only (404 for everyone else): close / reopen requests and
 * reports, businesses waiting for approval, and the suspended and closed
 * ones.
 */
export default async function AdminPage() {
  await requireAdmin();
  const { t } = await getTranslations();
  const [requests, pending, suspended, closed] = await Promise.all([
    openRequests(),
    businessesWithStatus("pending"),
    businessesWithStatus("suspended"),
    businessesWithStatus("closed"),
  ]);

  return (
    <Screen>
      <AppHeader title={t("Admin")} back={href("profile")} />
      <PullToRefresh>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 pt-2 pb-8">
          {!requests.length && !pending.length && (
            <StatusScreen
              icon={CheckmarkCircle02Icon}
              title={t("All caught up")}
              description={t("No businesses or requests waiting for you.")}
              inline
            />
          )}
          {requests.length > 0 && (
            <Section title={t("Requests")} count={requests.length}>
              {requests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </Section>
          )}
          {[
            [t("Waiting for approval"), pending],
            [t("Suspended"), suspended],
            [t("Closed"), closed],
          ].map(
            ([title, list]) =>
              list.length > 0 && (
                <Section
                  key={title as string}
                  title={title as string}
                  count={list.length}
                >
                  {(list as BusinessSummary[]).map((business) => (
                    <BusinessCard key={business.username} business={business} />
                  ))}
                </Section>
              ),
          )}
        </main>
      </PullToRefresh>
    </Screen>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        {title}
        <span className="text-sm font-medium text-muted-foreground">
          {count}
        </span>
      </h2>
      {children}
    </section>
  );
}

const CARD =
  "flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/5";

async function BusinessCard({ business }: { business: BusinessSummary }) {
  const { locale } = await getTranslations();
  return (
    <article className={CARD}>
      <div className="flex items-center justify-between gap-3">
        <StackLink
          href={href("business", { params: { username: business.username } })}
          className="flex min-h-11 min-w-0 flex-col justify-center text-start"
        >
          <span dir="auto" className="truncate font-semibold">
            {inLocale(business.name, locale)}
          </span>
          <bdi dir="ltr" className="truncate text-sm text-muted-foreground">
            @{business.username}
          </bdi>
        </StackLink>
        <BusinessStatusBadge status={business.status} />
      </div>
      <AdminStatusControls
        username={business.username}
        status={business.status}
      />
    </article>
  );
}

async function RequestCard({ request }: { request: OpenRequest }) {
  const { t, locale } = await getTranslations();
  const what =
    request.kind === "reopen"
      ? t("Asks to reopen")
      : request.byCreator
        ? t("Asks to close")
        : t("Reported as closed");
  return (
    <article className={CARD}>
      <div className="flex items-center justify-between gap-3">
        <StackLink
          href={href("business", {
            params: { username: request.business.username },
          })}
          className="flex min-h-11 min-w-0 flex-col justify-center text-start"
        >
          <span dir="auto" className="truncate font-semibold">
            {inLocale(request.business.name, locale)}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {what} · {request.author.name} ·{" "}
            <time dateTime={request.createdAt.toISOString()}>
              {timeAgo(request.createdAt, locale)}
            </time>
          </span>
        </StackLink>
        <BusinessStatusBadge status={request.business.status} />
      </div>
      {request.note && (
        <p dir="auto" className="rounded-xl bg-muted px-3 py-2 text-sm">
          {request.note}
        </p>
      )}
      <RequestControls id={request.id} />
    </article>
  );
}
