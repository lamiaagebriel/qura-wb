import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import {
  HugeiconsIcon,
  PinIcon,
  PlusSignIcon,
} from "@/components/icons";
import { StackLink } from "@/components/navigation/stack-link";
import { Screen } from "@/components/navigation/screen";
import { CancelPlaceRequest } from "@/components/places/place-controls";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { StatusScreen } from "@/components/status-screen";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getPlaceIndex } from "@/lib/data/places";
import { ticketsSentBy } from "@/lib/data/tickets";
import { timeAgo } from "@/lib/format";
import { getTranslations } from "@/lib/i18n/server";
import { inLocale, type Localized } from "@/lib/localized";
import { ALREADY_ADDED } from "@/lib/place-requests";
import { placeLabel } from "@/lib/places";
import { href } from "@/lib/routes";
import { TICKET_STATUS_LABELS, type TicketStatus } from "@/lib/tickets/statuses";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("Place requests"), robots: { index: false, follow: true } };
}

const STATUS_CLASSES: Record<TicketStatus, string> = {
  open: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  escalated: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  rejected: "bg-destructive/10 text-destructive",
  dismissed: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

/**
 * The new places you asked for, each with where it stands; an open one can
 * be cancelled. Only the super admin answers them (place admins are
 * dashboard-only). Only you see it.
 */
export default async function MyPlacesPage() {
  const [{ t, locale }, user, places] = await Promise.all([
    getTranslations(),
    requireUser(href("myPlaces")),
    getPlaceIndex(),
  ]);
  const requests = await ticketsSentBy(user.id, ["new_place"]);

  return (
    <Screen>
      <AppHeader
        title={t("Place requests")}
        back={href("profile")}
        action={
          <StackLink
            href={href("newPlace")}
            aria-label={t("Request a place")}
            className={cn(buttonVariants({ variant: "ghost" }), "size-11 rounded-full")}
          >
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-5" />
          </StackLink>
        }
      />
      <PullToRefresh>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 pt-2 pb-8">
          <section aria-label={t("Your requests")} className="flex flex-col gap-3">
            {requests.length ? (
              <ul className="flex flex-col gap-3">
                {requests.map((request) => {
                  const parent = request.refs[0] && "slug" in request.refs[0] ? request.refs[0].slug : null;
                  return (
                  <li
                    key={request.id}
                    className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-col">
                        <span dir="auto" className="font-semibold">
                          {inLocale(request.data.name as Localized, locale)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {parent &&
                            t("In {{city}}", { city: placeLabel(places, parent, locale) })}{" "}
                          · {timeAgo(request.createdAt, locale)}
                        </span>
                      </div>
                      <Badge className={STATUS_CLASSES[request.status]}>
                        {t(TICKET_STATUS_LABELS[request.status])}
                      </Badge>
                    </div>
                    {request.status === "rejected" && request.answer?.note && (
                      <p dir="auto" className="rounded-xl bg-muted px-3 py-2 text-sm">
                        {request.answer.note === ALREADY_ADDED
                          ? t(ALREADY_ADDED)
                          : request.answer.note}
                      </p>
                    )}
                    {request.status === "open" && <CancelPlaceRequest id={request.id} />}
                  </li>
                  );
                })}
              </ul>
            ) : (
              <StatusScreen
                icon={PinIcon}
                title={t("No requests yet")}
                description={t("Can't find your place? Ask for it with the + above.")}
                inline
              />
            )}
          </section>
        </main>
      </PullToRefresh>
    </Screen>
  );
}
