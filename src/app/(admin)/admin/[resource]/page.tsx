import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPage } from "@/components/admin/admin-page";
import { DataTable } from "@/components/admin/data-table";
import { HugeiconsIcon, PlusSignIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { recordHref } from "@/lib/admin/links";
import { menuItem } from "@/lib/admin/menu";
import { resourceOf } from "@/lib/admin/registry";
import type { Ctx } from "@/lib/admin/resource";
import type { ListParams } from "@/lib/admin/types";
import { requireAdmin } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

type TableProps = {
  params: Promise<{ resource: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: TableProps): Promise<Metadata> {
  const [{ t }, { resource }] = await Promise.all([getTranslations(), params]);
  const item = menuItem(resource);
  return { title: item ? t(item.label) : t("Page not found") };
}

/** URL params that aren't filters. */
const RESERVED = new Set(["q", "sort", "page"]);

/** Filters other screens link with (a user's posts…): shown as chips. */
const EXTRA_LABELS: Record<string, string> = {
  author: "@{{value}}",
  owner: "@{{value}}",
  business: "@{{value}}",
};

/** Any table of the dashboard: `/admin/<table>?q=&sort=&page=&<filter>=`. */
export default async function AdminTablePage({ params, searchParams }: TableProps) {
  const admin = await requireAdmin();
  const [{ t, locale }, { resource: key }, query] = await Promise.all([getTranslations(), params, searchParams]);
  const resource = resourceOf(key);
  const item = menuItem(key);
  if (!resource || !item) notFound();
  const ctx: Ctx = { t, locale, adminId: admin.id };

  const one = (value: string | string[] | undefined) => (typeof value === "string" ? value.slice(0, 100) : "");
  const filters: Record<string, string> = {};
  for (const [name, value] of Object.entries(query)) {
    if (!RESERVED.has(name) && one(value)) filters[name] = one(value);
  }
  const list: ListParams = {
    q: one(query.q).trim(),
    sort: one(query.sort) || resource.defaultSort,
    page: Math.max(1, Number(one(query.page)) || 1),
    filters,
  };
  const [result, filterSpecs] = await Promise.all([resource.list(list, ctx), resource.filters?.(ctx) ?? []]);
  const known = new Set(filterSpecs.map((f) => f.key));
  const extraFilters = Object.entries(filters)
    .filter(([name]) => !known.has(name) && EXTRA_LABELS[name])
    .map(([name, value]) => ({ key: name, label: EXTRA_LABELS[name].replace("{{value}}", value) }));

  return (
    <AdminPage
      title={t(item.label)}
      icon={item.icon}
      tint={item.tint}
      count={result.total}
      actions={
        resource.blank && (
          <Link
            href={recordHref(key, "new")}
            className={cn(buttonVariants(), "h-11 gap-1.5 md:h-9")}
          >
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4" />
            {t("Add")}
          </Link>
        )
      }
    >
      <DataTable
        table={key}
        columns={resource.columns(ctx)}
        rows={result.rows}
        total={result.total}
        filters={filterSpecs}
        search={resource.search?.(ctx)}
        extraFilters={extraFilters}
      />
    </AdminPage>
  );
}
