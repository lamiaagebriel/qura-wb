"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { CellView } from "@/components/admin/cell";
import {
  ArrowDown01Icon,
  ArrowLeftDoubleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  Cancel01Icon,
  HugeiconsIcon,
  SearchIcon,
  Settings02Icon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PAGE_SIZE, type Column, type Filter, type Row } from "@/lib/admin/types";
import { useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const ALL = "__all";

/**
 * A dashboard table. Search, filters, sorting and paging live in the URL
 * and run in the database (the page re-renders); showing / hiding columns
 * is TanStack Table, remembered per table in this browser. A row opens its
 * record; links inside it go where they point.
 */
export function DataTable({
  table: name,
  columns,
  rows,
  total,
  filters,
  search,
  extraFilters,
}: {
  /** The table's key (remembers its columns). */
  table: string;
  columns: Column[];
  rows: Row[];
  total: number;
  filters: Filter[];
  /** The search box's hint; absent = no search. */
  search?: string;
  /** Filters set from elsewhere (a user's posts…), shown as removable chips. */
  extraFilters: { key: string; label: string }[];
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const sort = params.get("sort") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /** Changes URL params (`null` removes one); any change but paging goes back to page 1. */
  const go = (changes: Record<string, string | null>) => {
    // The live URL, not this render's copy: two quick changes (clearing
    // the search and the filters) mustn't undo each other.
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    if (!("page" in changes)) next.delete("page");
    const query = next.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  };

  // The search box: sent 300ms after typing stops.
  // `sent`: the last text sent, so emptying the box from "Clear" doesn't
  // send again (racing the clear).
  const [query, setQuery] = useState(params.get("q") ?? "");
  const sent = useRef(query);
  useEffect(() => {
    if (query === sent.current) return;
    const timer = setTimeout(() => {
      sent.current = query;
      go({ q: query.trim() || null });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on typing
  }, [query]);

  // Shown columns, remembered per table.
  const storageKey = `qura.admin.columns.${name}`;
  const [visibility, setVisibility] = useState<VisibilityState>(() =>
    Object.fromEntries(columns.map((c) => [c.key, !c.hidden])),
  );
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setVisibility((current) => ({ ...current, ...JSON.parse(saved) }));
    } catch {
      // Storage blocked: the defaults stay.
    }
  }, [storageKey]);
  const changeVisibility = (next: VisibilityState) => {
    setVisibility(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Storage blocked: only for this visit.
    }
  };

  const columnDefs = useMemo<ColumnDef<Row>[]>(
    () =>
      columns.map((column) => ({
        id: column.key,
        accessorFn: (row) => row.cells[column.key],
        header: () => {
          if (!column.sortable) return column.label;
          const current = sort === column.key ? "asc" : sort === `-${column.key}` ? "desc" : null;
          return (
            <button
              type="button"
              onClick={() => go({ sort: current === "desc" ? column.key : `-${column.key}` })}
              className="-mx-1 inline-flex h-8 items-center gap-1 rounded-md px-1 tracking-wide uppercase hover:bg-muted"
              aria-label={t("Sort by {{column}}", { column: column.label })}
            >
              {column.label}
              <HugeiconsIcon
                icon={current === "asc" ? ArrowUp01Icon : current === "desc" ? ArrowDown01Icon : ArrowUpDownIcon}
                strokeWidth={2}
                className={cn("size-3.5", !current && "text-muted-foreground/60")}
              />
            </button>
          );
        },
        cell: ({ row }) => <CellView cell={row.original.cells[column.key] ?? { kind: "empty" }} />,
        meta: { align: column.align },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `go` reads the latest params
    [columns, sort, t],
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table's API returns functions React Compiler can't memoize
  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility: visibility },
    onColumnVisibilityChange: (updater) =>
      changeVisibility(typeof updater === "function" ? updater(visibility) : updater),
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
  });

  const number = new Intl.NumberFormat(locale);
  const from = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(total, page * PAGE_SIZE);
  const activeFilters = filters.filter((f) => params.get(f.key));

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar: search, filters, columns. */}
      <div className="flex flex-wrap items-center gap-2">
        {search && (
          <div className="relative w-full sm:w-72">
            <HugeiconsIcon
              icon={SearchIcon}
              strokeWidth={2}
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={search}
              aria-label={search}
              enterKeyHint="search"
              autoComplete="off"
              className="h-11 ps-9 md:h-9"
            />
          </div>
        )}
        {filters.map((filter) => {
          const value = params.get(filter.key) ?? ALL;
          const items = [{ value: ALL, label: filter.label }, ...filter.options];
          return (
            <Select
              key={filter.key}
              items={items}
              value={value}
              onValueChange={(next) => go({ [filter.key]: next === ALL ? null : (next as string) })}
            >
              <SelectTrigger
                aria-label={filter.label}
                className={cn(
                  "h-11 min-w-32 rounded-lg text-sm md:h-9",
                  value !== ALL && "border-primary/40 bg-primary/5 text-foreground",
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {items.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.value === ALL ? t("All") : option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}
        {extraFilters.map((filter) => (
          <Button
            key={filter.key}
            variant="secondary"
            className="h-11 gap-1.5 rounded-lg md:h-9"
            onClick={() => go({ [filter.key]: null })}
            aria-label={t("Remove filter: {{filter}}", { filter: filter.label })}
          >
            {filter.label}
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3.5" />
          </Button>
        ))}
        {(activeFilters.length > 0 || params.get("q")) && (
          <Button
            variant="ghost"
            className="h-11 rounded-lg text-muted-foreground md:h-9"
            onClick={() => {
              sent.current = "";
              setQuery("");
              go({ q: null, ...Object.fromEntries(filters.map((f) => [f.key, null])) });
            }}
          >
            {t("Clear")}
          </Button>
        )}
        <span className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" className="h-11 gap-1.5 rounded-lg md:h-9" />}
          >
            <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} className="size-4" />
            {t("Columns")}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t("Show columns")}</DropdownMenuLabel>
              {table.getAllLeafColumns().map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(checked) => column.toggleVisibility(!!checked)}
                >
                  {columns.find((c) => c.key === column.id)?.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* The table. */}
      <div
        className={cn(
          "overflow-hidden rounded-xl border bg-card transition-opacity",
          pending && "opacity-60",
        )}
        aria-busy={pending}
      >
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "h-10 text-xs font-semibold tracking-wide text-muted-foreground uppercase",
                      (header.column.columnDef.meta as { align?: string })?.align === "end" && "text-end",
                    )}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                const href = row.original.href;
                return (
                  <TableRow
                    key={row.id}
                    onClick={href ? () => router.push(href) : undefined}
                    onKeyDown={
                      href
                        ? (event) => {
                            if (event.key === "Enter") router.push(href);
                          }
                        : undefined
                    }
                    tabIndex={href ? 0 : undefined}
                    className={cn(href && "cursor-pointer")}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "py-2.5",
                          (cell.column.columnDef.meta as { align?: string })?.align === "end" && "text-end",
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  {t("Nothing found")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paging. */}
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {t("{{from}}–{{to}} of {{total}}", {
            from: number.format(from),
            to: number.format(to),
            total: number.format(total),
          })}
        </span>
        <div className="flex items-center gap-1">
          {(
            [
              [ArrowLeftDoubleIcon, 1, t("First page")],
              [ArrowLeft01Icon, page - 1, t("Previous page")],
              [ArrowRight01Icon, page + 1, t("Next page")],
              [ArrowRightDoubleIcon, pages, t("Last page")],
            ] as const
          ).map(([icon, target, label]) => (
            <Button
              key={label}
              variant="outline"
              size="icon"
              className="size-11 md:size-8"
              aria-label={label}
              disabled={target < 1 || target > pages || target === page}
              onClick={() => go({ page: target === 1 ? null : String(target) })}
            >
              <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4 rtl:rotate-180" />
            </Button>
          ))}
          <span className="px-2 tabular-nums">
            {t("Page {{page}} of {{pages}}", { page: number.format(page), pages: number.format(pages) })}
          </span>
        </div>
      </div>
    </div>
  );
}
