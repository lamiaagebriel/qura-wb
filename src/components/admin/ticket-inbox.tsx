import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import Link from "next/link";
import type { ReactNode } from "react";

import { CellView } from "@/components/admin/cell";
import { RecordActions } from "@/components/admin/record-controls";
import { CheckmarkCircle02Icon } from "@/components/icons";
import { StatusScreen } from "@/components/status-screen";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/db";
import { businesses, users } from "@/db/schema";
import { recordHref, tableHref } from "@/lib/admin/links";
import type { Ctx } from "@/lib/admin/resource";
import { ticketInbox } from "@/lib/admin/resources/tickets";
import { postsUnderReview } from "@/lib/data/place-admins";
import type { Cell, RecordAction } from "@/lib/admin/types";
import { getTranslations } from "@/lib/i18n/server";
import { inLocale } from "@/lib/localized";

const owners = alias(users, "owners");

type InboxRow = { id: string; resource: string; cells: Record<string, Cell>; actions: RecordAction[] };

/** Businesses waiting for approval, with Approve / Suspend. */
async function pendingBusinesses(ctx: Ctx): Promise<InboxRow[]> {
  const rows = await db
    .select({ id: businesses.id, name: businesses.name, username: businesses.username, createdAt: businesses.createdAt, owner: { id: owners.id, name: owners.name } })
    .from(businesses)
    .leftJoin(owners, eq(owners.id, businesses.ownerId))
    .where(eq(businesses.status, "pending"))
    .orderBy(asc(businesses.createdAt))
    .limit(200);
  return rows.map((b) => {
    const name = inLocale(b.name, ctx.locale);
    return {
      id: b.id,
      resource: "businesses",
      cells: {
        about: { kind: "link", value: name, href: recordHref("businesses", b.id), sub: `@${b.username}` },
        from: b.owner?.id ? { kind: "link", value: b.owner.name, href: recordHref("users", b.owner.id) } : { kind: "empty" },
        sent: { kind: "date", value: b.createdAt.toISOString() },
      },
      actions: [
        { key: "status:active", label: ctx.t("Approve") },
        {
          key: "status:suspended",
          label: ctx.t("Suspend"),
          tone: "destructive",
          confirm: { title: ctx.t("Suspend {{name}}?", { name }), description: ctx.t("It's hidden everywhere until you restore it. Its owner still sees it.") },
        },
      ],
    };
  });
}

/** Hidden posts their authors edited since: show again, or keep hidden. */
async function editedPosts(ctx: Ctx): Promise<InboxRow[]> {
  const rows = await postsUnderReview("all");
  return rows.map((post) => ({
    id: post.id,
    resource: "posts",
    cells: {
      about: { kind: "link", value: post.body.slice(0, 120), href: recordHref("posts", post.id) },
      detail: { kind: "text", value: post.hiddenReason ?? "", dir: "auto" },
      from: { kind: "text", value: post.author.name, dir: "auto" },
    },
    actions: [
      { key: "show", label: ctx.t("Show again") },
      {
        key: "hide",
        label: ctx.t("Keep hidden"),
        tone: "destructive",
        confirm: { title: ctx.t("Keep hidden"), description: ctx.t("They'll see your reason."), input: ctx.t("Reason") },
      },
    ],
  }));
}

/**
 * The super admin's inbox: what waits for an answer, oldest first. Requests
 * start with the businesses waiting for approval; reports with the hidden
 * posts edited since, then every open (or sent-on) report. Each row answers in place; its page has the rest.
 */
export async function TicketInbox({ kind, adminId }: { kind: "request" | "report"; adminId: string }) {
  const { t, locale } = await getTranslations();
  const ctx: Ctx = { t, locale, adminId };
  const [waiting, open] = await Promise.all([
    kind === "request" ? pendingBusinesses(ctx) : editedPosts(ctx),
    ticketInbox(kind, ctx),
  ]);

  if (!waiting.length && !open.length) {
    return (
      <StatusScreen
        icon={CheckmarkCircle02Icon}
        title={t("All caught up")}
        description={kind === "request" ? t("No businesses or requests waiting for you.") : t("No reports waiting for you.")}
        inline
      />
    );
  }

  return (
    <>
      {waiting.length > 0 && (
        <Block title={kind === "request" ? t("Waiting for approval") : t("Edited after hiding")} count={waiting.length}>
          <InboxTable
            columns={
              kind === "request"
                ? [
                    { key: "about", label: t("Business") },
                    { key: "from", label: t("Owner") },
                    { key: "sent", label: t("Added") },
                  ]
                : [
                    { key: "about", label: t("Post") },
                    { key: "detail", label: t("Hidden because") },
                    { key: "from", label: t("By") },
                  ]
            }
            rows={waiting}
            actionsLabel={t("Actions")}
          />
        </Block>
      )}
      {open.length > 0 && (
        <Block
          title={kind === "request" ? t("Requests") : t("Reports")}
          count={open.length}
          more={{ href: tableHref("tickets", { kind }), label: t("All tickets") }}
        >
          <InboxTable
            columns={[
              { key: "type", label: t("Type") },
              { key: "about", label: t("About") },
              { key: "detail", label: t("Details") },
              { key: "from", label: t("From") },
              { key: "status", label: t("Status") },
              { key: "sent", label: t("Sent") },
            ]}
            rows={open.map((row) => ({ id: row.id, resource: "tickets", cells: row.cells, actions: row.actions }))}
            actionsLabel={t("Actions")}
          />
        </Block>
      )}
    </>
  );
}

function InboxTable({ columns, rows, actionsLabel }: { columns: { key: string; label: string }[]; rows: InboxRow[]; actionsLabel: string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key}>{column.label}</TableHead>
          ))}
          <TableHead className="text-end">{actionsLabel}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            {columns.map((column) => (
              <TableCell key={column.key} className="max-w-72 whitespace-normal">
                <CellView cell={row.cells[column.key] ?? { kind: "empty" }} />
              </TableCell>
            ))}
            <TableCell>
              <div className="flex justify-end">
                <RecordActions resource={row.resource} id={row.id} actions={row.actions} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Block({ title, count, more, children }: { title: string; count: number; more?: { href: string; label: string }; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-semibold">
          {title} <span className="text-muted-foreground">{count}</span>
        </h2>
        {more && (
          <Link href={more.href} className="text-sm text-muted-foreground hover:underline">
            {more.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
