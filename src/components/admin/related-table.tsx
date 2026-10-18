"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { CellView } from "@/components/admin/cell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Related } from "@/lib/admin/types";
import { useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/** Rows related to a record (a business's branches…), each opening its own record. */
export function RelatedTable({ related }: { related: Related }) {
  const { t, locale } = useLocale();
  const router = useRouter();
  return (
    <section aria-label={related.title} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold">
          {related.title}{" "}
          <span className="text-sm font-medium text-muted-foreground tabular-nums">
            {new Intl.NumberFormat(locale).format(related.more?.total ?? related.rows.length)}
          </span>
        </h2>
        {related.more && related.more.total > related.rows.length && (
          <Link href={related.more.href} className="text-sm font-medium text-primary hover:underline">
            {t("See all")}
          </Link>
        )}
      </div>
      {related.rows.length ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                {related.columns.map((column) => (
                  <TableHead key={column.key} className="h-9 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {related.rows.map((row, i) => (
                <TableRow
                  key={i}
                  onClick={row.href ? () => router.push(row.href!) : undefined}
                  className={cn(row.href && "cursor-pointer")}
                >
                  {related.columns.map((column) => (
                    <TableCell key={column.key} className="py-2">
                      <CellView cell={row.cells[column.key] ?? { kind: "empty" }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          {t("None yet")}
        </p>
      )}
    </section>
  );
}
