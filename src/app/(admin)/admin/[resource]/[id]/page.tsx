import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPage } from "@/components/admin/admin-page";
import { CellView, ToneBadge } from "@/components/admin/cell";
import { RecordForm } from "@/components/admin/record-form";
import { DeleteRecord, RecordActions } from "@/components/admin/record-controls";
import { RelatedTable } from "@/components/admin/related-table";
import { HugeiconsIcon, LinkSquare02Icon, LockIcon, Task01Icon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { isValidId } from "@/db/helpers";
import { tableHref } from "@/lib/admin/links";
import { menuItem } from "@/lib/admin/menu";
import { resourceOf } from "@/lib/admin/registry";
import type { Ctx } from "@/lib/admin/resource";
import { RECORD_PAGES } from "@/lib/admin/resources/tickets";
import { isEditable } from "@/lib/admin/schemas";
import { requireAdmin } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

type RecordProps = {
  params: Promise<{ resource: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: RecordProps): Promise<Metadata> {
  const [{ t }, { resource }] = await Promise.all([getTranslations(), params]);
  const item = menuItem(resource);
  return { title: item ? t(item.label) : t("Page not found") };
}

/**
 * One record (`id` = "new": adding one): what can be edited (a shadcn form,
 * zod-checked), what can't and why, its actions, related rows, and — only
 * where it's safe — deleting it for good.
 */
export default async function AdminRecordPage({ params, searchParams }: RecordProps) {
  const admin = await requireAdmin();
  const [{ t, locale }, { resource: key, id }, query] = await Promise.all([getTranslations(), params, searchParams]);
  const resource = resourceOf(key);
  const item = menuItem(key);
  if (!resource || !item) notFound();
  const ctx: Ctx = { t, locale, adminId: admin.id };

  const adding = id === "new";
  const plain = Object.fromEntries(
    Object.entries(query).flatMap(([name, value]) => (typeof value === "string" ? [[name, value]] : [])),
  );
  const view = adding
    ? resource.blank && (await resource.blank(ctx, plain))
    : isValidId(id) && resource.view
      ? await resource.view(id, ctx)
      : null;
  if (!view) notFound();
  // The table it lives in, when its changes are recorded (its history).
  const table = Object.entries(RECORD_PAGES).find(([, page]) => page === key)?.[0];
  const editable = isEditable(key) && view.fields.length > 0 && (adding ? !!resource.create : !!resource.update);

  return (
    <AdminPage
      title={view.title}
      icon={item.icon}
      tint={item.tint}
      back={{ href: tableHref(key), label: t(item.label) }}
      description={
        (view.subtitle || view.badges?.length) && (
          <span className="flex flex-wrap items-center gap-2">
            {view.subtitle && <span dir="auto">{view.subtitle}</span>}
            {view.badges?.map((badge, i) => <ToneBadge key={i} value={badge.value} tone={badge.tone} />)}
          </span>
        )
      }
      actions={
        (view.publicHref || (table && !adding)) && (
          <span className="flex flex-wrap gap-2">
            {table && !adding && (
              <Link
                href={tableHref("history", { table, record: id })}
                className={cn(buttonVariants({ variant: "outline" }), "h-11 gap-1.5 md:h-9")}
              >
                <HugeiconsIcon icon={Task01Icon} strokeWidth={2} className="size-4" />
                {t("History")}
              </Link>
            )}
            {view.publicHref && (
              <Link
                href={view.publicHref}
                target="_blank"
                className={cn(buttonVariants({ variant: "outline" }), "h-11 gap-1.5 md:h-9")}
              >
                <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} className="size-4" />
                {t("Open in the app")}
              </Link>
            )}
          </span>
        )
      }
    >
      {!adding && <RecordActions resource={key} id={id} actions={view.actions} />}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="flex min-w-0 flex-col gap-6">
          {editable && isEditable(key) && (
            <section aria-labelledby="edit" className="rounded-xl border bg-card p-4 md:p-5">
              <h2 id="edit" className="mb-4 font-semibold">
                {adding ? t("Details") : t("Edit")}
              </h2>
              <RecordForm resource={key} id={id} fields={view.fields} values={view.values} />
            </section>
          )}
          {view.related.map((related) => (
            <RelatedTable key={related.title} related={related} />
          ))}
        </div>

        {view.locked.length > 0 && (
          <aside aria-labelledby="locked" className="h-fit rounded-xl border bg-muted/30 p-4 md:p-5">
            <h2 id="locked" className="mb-3 flex items-center gap-2 font-semibold">
              <HugeiconsIcon icon={LockIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
              {t("Can't be edited")}
            </h2>
            <dl className="flex flex-col divide-y">
              {view.locked.map((locked) => (
                <div key={locked.label} className="flex flex-col gap-1 py-2.5">
                  <dt className="text-xs font-medium text-muted-foreground">{locked.label}</dt>
                  <dd className="text-sm">
                    <CellView cell={locked.value} />
                  </dd>
                  <dd className="text-xs text-muted-foreground/80">{locked.reason}</dd>
                </div>
              ))}
            </dl>
          </aside>
        )}
      </div>

      {!adding && view.deletion && (
        <DeleteRecord resource={key} id={id} warning={view.deletion.warning} confirmWord={view.deletion.confirmWord} />
      )}
    </AdminPage>
  );
}
