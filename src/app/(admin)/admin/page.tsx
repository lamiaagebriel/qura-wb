import type { Metadata } from "next";
import Link from "next/link";

import { AdminPage } from "@/components/admin/admin-page";
import { Sparkline } from "@/components/admin/sparkline";
import {
  ArrowRight01Icon,
  DashboardSquare02Icon,
  Flag01Icon,
  HugeiconsIcon,
  InboxIcon,
  Message01Icon,
  Store01Icon,
  UserMultiple02Icon,
  type IconSvgElement,
} from "@/components/icons";
import { tableHref } from "@/lib/admin/links";
import { requireAdmin } from "@/lib/auth/session";
import { overview, trends } from "@/lib/data/admin";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("Overview") };
}

// Each count's color is its section's (sidebar), so a color means one thing.
const COLORS = {
  users: { line: "var(--color-sky-500)", tint: "text-sky-600 dark:text-sky-400" },
  businesses: { line: "var(--color-emerald-500)", tint: "text-emerald-600 dark:text-emerald-400" },
  posts: { line: "var(--color-rose-500)", tint: "text-rose-600 dark:text-rose-400" },
};

/** What waits for the admin first, then the app's numbers with their last 30 days. */
export default async function AdminOverviewPage() {
  await requireAdmin();
  const { t, locale } = await getTranslations();
  const [stats, days] = await Promise.all([overview(), trends()]);
  const n = (value: number) => new Intl.NumberFormat(locale).format(value);
  const series = (key: "users" | "businesses" | "posts") => days.map((d) => ({ day: d.day, value: d[key] }));
  const last30 = (key: "users" | "businesses" | "posts") => days.reduce((sum, d) => sum + d[key], 0);

  return (
    <AdminPage title={t("Overview")} icon={DashboardSquare02Icon} tint="text-violet-600 dark:text-violet-400">
      <section aria-labelledby="todo" className="flex flex-col gap-3">
        <h2 id="todo" className="text-sm font-semibold text-muted-foreground">
          {t("Waiting for you")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <TodoCard
            href={tableHref("businesses", { status: "pending" })}
            icon={Store01Icon}
            label={t("Businesses waiting for approval")}
            value={stats.pendingBusinesses}
            format={n}
            tone="amber"
          />
          <TodoCard
            href={href("adminRequests")}
            icon={InboxIcon}
            label={t("Open requests")}
            value={stats.openRequests}
            format={n}
            tone="amber"
          />
          <TodoCard
            href={href("adminReports")}
            icon={Flag01Icon}
            label={t("Open reports")}
            value={stats.openReports}
            format={n}
            tone="red"
          />
        </div>
      </section>

      <section aria-labelledby="numbers" className="flex flex-col gap-3">
        <h2 id="numbers" className="text-sm font-semibold text-muted-foreground">
          {t("Numbers")} <span className="font-normal">· {t("last 30 days")}</span>
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <StatCard
            href={tableHref("users")}
            icon={UserMultiple02Icon}
            label={t("Users")}
            value={n(stats.users.total)}
            details={[
              t("{{count}} in 30 days", { count: n(last30("users")) }),
              t("{{count}} suspended", { count: n(stats.users.suspended) }),
            ]}
            trend={<Sparkline data={series("users")} label={t("New users")} color={COLORS.users.line} />}
            tint={COLORS.users.tint}
          />
          <StatCard
            href={tableHref("businesses")}
            icon={Store01Icon}
            label={t("Businesses")}
            value={n(stats.businesses.total)}
            details={[
              t("{{count}} in 30 days", { count: n(last30("businesses")) }),
              t("{{count}} live", { count: n(stats.businesses.active) }),
            ]}
            trend={<Sparkline data={series("businesses")} label={t("New businesses")} color={COLORS.businesses.line} />}
            tint={COLORS.businesses.tint}
          />
          <StatCard
            href={tableHref("posts")}
            icon={Message01Icon}
            label={t("Posts")}
            value={n(stats.posts.total)}
            details={[t("{{count}} in 30 days", { count: n(last30("posts")) })]}
            trend={<Sparkline data={series("posts")} label={t("New posts")} color={COLORS.posts.line} />}
            tint={COLORS.posts.tint}
          />
        </div>
      </section>
    </AdminPage>
  );
}

const TODO_TONES = {
  amber: "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-400",
  red: "bg-red-500/10 text-red-700 ring-red-500/25 dark:text-red-400",
};

/** Something to act on: colored while there's work, quiet when there's none. */
function TodoCard({
  href: to,
  icon,
  label,
  value,
  format,
  tone,
}: {
  href: string;
  icon: IconSvgElement;
  label: string;
  value: number;
  format: (value: number) => string;
  tone: keyof typeof TODO_TONES;
}) {
  return (
    <Link
      href={to}
      className={cn(
        "group flex min-h-16 items-center gap-3 rounded-xl p-4 ring-1 transition-colors",
        value > 0 ? TODO_TONES[tone] : "bg-card text-muted-foreground ring-foreground/10 hover:bg-muted",
      )}
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-5 shrink-0" />
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      <span className="text-2xl font-bold tabular-nums">{format(value)}</span>
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        strokeWidth={2}
        className="size-4 opacity-60 transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
      />
    </Link>
  );
}

function StatCard({
  href: to,
  icon,
  label,
  value,
  details,
  trend,
  tint,
}: {
  href: string;
  icon: IconSvgElement;
  label: string;
  value: string;
  details: string[];
  trend: React.ReactNode;
  tint: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <Link href={to} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <span className={cn("flex size-7 items-center justify-center rounded-lg bg-current/10", tint)}>
          <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
        </span>
        {label}
      </Link>
      <span className="text-3xl font-bold tracking-tight tabular-nums">{value}</span>
      {trend}
      <span className="text-xs text-muted-foreground">{details.join(" · ")}</span>
    </div>
  );
}
