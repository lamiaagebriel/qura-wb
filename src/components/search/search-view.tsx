"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { AppHeader } from "@/components/app-header";
import {
  ArrowLeft01Icon,
  Cancel01Icon,
  Clock01Icon,
  HugeiconsIcon,
  Search01Icon,
} from "@/components/icons";
import { BusinessList } from "@/components/profile/business-list";
import type { BusinessSummary } from "@/lib/business";
import { cn } from "@/lib/utils";
import { StatusScreen } from "@/components/status-screen";
import { Button, buttonVariants } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Spinner } from "@/components/ui/spinner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { CategoryAvatar } from "@/components/category-avatar";
import { ALL_CATEGORIES, CATEGORIES, categoryOf } from "@/lib/categories";
import { useLocale } from "@/lib/i18n/provider";
import { useRecentSearches } from "@/lib/recent-searches";
import { href } from "@/lib/routes";

import { searchBusinesses } from "@/server/actions/search";

/**
 * Search screen: field focused on open (keyboard "search" key), recent
 * searches kept on the device, and the top-level categories — tapping one
 * searches for it. A search matches businesses by name, handle, category and
 * description (on the server). While searching, the field starts with a
 * back arrow that returns here (a spinner while results load); the clear
 * button only empties the field.
 * The current search lives in the URL (`?q=`, replaced, not pushed): open
 * a result and come back, and the search is still there. `initial*` is
 * that search rendered on the server (a reload or a shared link); coming
 * back, the router may restore Search without it, so the URL wins.
 */
export function SearchView({
  categoryCounts,
  initialQuery,
  initialResults,
}: {
  /** Businesses per category in the visitor's city, subcategories included. */
  categoryCounts: Record<string, number>;
  initialQuery: string;
  initialResults: BusinessSummary[];
}) {
  const { t, locale } = useLocale();
  const { recent, add, remove, clear } = useRecentSearches();
  const inputRef = useRef<HTMLInputElement>(null);
  const urlQuery = useSearchParams().get("q")?.trim() || initialQuery;
  const [query, setQuery] = useState(urlQuery);
  const [submitted, setSubmitted] = useState<string | null>(urlQuery || null);
  // `null`: not loaded yet (a search restored from the URL).
  const [results, setResults] = useState<BusinessSummary[] | null>(
    urlQuery === initialQuery ? initialResults : null,
  );
  const [isPending, startTransition] = useTransition();
  // Only the latest search may show its results (an older one can finish later).
  const latest = useRef(0);

  /** Keeps `?q=` in step with the search, without a new history entry. */
  const setUrlQuery = (q: string | null) =>
    window.history.replaceState(null, "", href("search", { query: { q } }));

  /** Fetches `q`'s results (on the server); the field shows a spinner. */
  const load = (q: string) => {
    const id = ++latest.current;
    startTransition(async () => {
      const found = await searchBusinesses(q);
      startTransition(() => {
        if (id !== latest.current) return;
        setResults(found);
        setSubmitted(q);
        setUrlQuery(q);
      });
    });
  };

  // A search restored from the URL without its results: load them.
  useEffect(() => {
    if (submitted && results === null) load(submitted);
    // Once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = (value: string) => {
    const q = value.trim();
    if (!q) return;
    setQuery(q);
    add(q);
    inputRef.current?.blur(); // dismiss the keyboard, like a native app
    load(q);
  };

  const clearField = () => {
    latest.current++; // a search still loading must not come back
    setQuery("");
    setSubmitted(null);
    setUrlQuery(null);
    inputRef.current?.focus();
  };

  /** Back to the start: no query, no results, keyboard down. */
  const exit = () => {
    latest.current++;
    setQuery("");
    setSubmitted(null);
    setResults([]);
    setUrlQuery(null);
    inputRef.current?.blur();
  };
  const searching = !!query || !!submitted || isPending;

  return (
    <>
      <AppHeader title={t("Search")} large>
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            search(query);
          }}
        >
          <InputGroup className="h-11 rounded-full">
            <InputGroupAddon className="ps-1.5">
              {isPending ? (
                <Spinner aria-label={t("Searching…")} className="mx-2 size-5" />
              ) : searching ? (
                <InputGroupButton
                  variant="secondary"
                  className="h-8 w-9 rounded-full"
                  aria-label={t("Exit search")}
                  onClick={exit}
                >
                  <HugeiconsIcon
                    icon={ArrowLeft01Icon}
                    className="rtl:rotate-180"
                  />
                </InputGroupButton>
              ) : (
                <HugeiconsIcon icon={Search01Icon} className="mx-2.5" />
              )}
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              type="search"
              name="q"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (!event.target.value) {
                  setSubmitted(null);
                  setUrlQuery(null);
                }
              }}
              placeholder={t("Search Qura")}
              aria-label={t("Search Qura")}
              enterKeyHint="search"
              autoComplete="off"
              // Not when coming back to a search (no keyboard over results).
              autoFocus={!urlQuery}
            />
            {query && (
              <InputGroupAddon align="inline-end" className="pe-1.5">
                {/* Clear + search joined into one pill (clipped round). */}
                <ButtonGroup className="overflow-hidden rounded-full">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-8 w-9"
                    aria-label={t("Clear search")}
                    onClick={clearField}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} />
                  </Button>
                  {query.trim() !== submitted && (
                    <Button
                      type="submit"
                      className="h-8 w-10"
                      aria-label={t("Search")}
                    >
                      <HugeiconsIcon icon={Search01Icon} />
                    </Button>
                  )}
                </ButtonGroup>
              </InputGroupAddon>
            )}
          </InputGroup>
        </form>
      </AppHeader>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
        {submitted && (
          <SubcategoryChips
            query={submitted}
            counts={categoryCounts}
            onPick={search}
          />
        )}
        {submitted && results === null ? null : submitted && results?.length ? (
          <div className="py-4">
            <BusinessList businesses={results} />
          </div>
        ) : submitted ? (
          <StatusScreen
            icon={Search01Icon}
            title={t("No results for “{{query}}”", { query: submitted })}
            description={t("Try a different word or check the spelling.")}
            inline
          />
        ) : (
          <>
            {recent.length > 0 && (
              <section
                aria-labelledby="recent-searches"
                className="flex flex-col gap-2 py-4"
              >
                <div className="flex items-center justify-between px-1">
                  <h2
                    id="recent-searches"
                    className="text-xs font-medium text-muted-foreground uppercase"
                  >
                    {t("Recent searches")}
                  </h2>
                  <Button variant="link" className="h-11 px-2" onClick={clear}>
                    {t("Clear")}
                  </Button>
                </div>
                <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
                  {recent.map((item) => (
                    <li key={item} className="flex items-center">
                      <button
                        type="button"
                        onClick={() => search(item)}
                        className={cn(
                          buttonVariants({ variant: "ghost" }),
                          "min-h-12 min-w-0 flex-1 shrink justify-start gap-3 rounded-none ps-4 text-start font-normal whitespace-normal",
                        )}
                      >
                        <HugeiconsIcon
                          icon={Clock01Icon}
                          className="size-4 shrink-0 text-muted-foreground"
                        />
                        <span className="truncate">{item}</span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-11 shrink-0 rounded-full text-muted-foreground"
                        aria-label={`${t("Remove")} ${item}`}
                        onClick={() => remove(item)}
                      >
                        <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section
              aria-labelledby="categories"
              className="flex flex-col gap-2 py-4"
            >
              <h2
                id="categories"
                className="px-1 text-xs font-medium text-muted-foreground uppercase"
              >
                {t("Categories")}
              </h2>
              <ul className="grid grid-cols-3 gap-2">
                {/* Ones with places first; empty ones dimmed at the end. */}
                {[...CATEGORIES]
                  .sort(
                    (a, b) =>
                      Number(!categoryCounts[a.slug]) -
                      Number(!categoryCounts[b.slug]),
                  )
                  .map((category) => {
                    const count = categoryCounts[category.slug] ?? 0;
                    return (
                      <li key={category.slug}>
                        <button
                          type="button"
                          onClick={() => search(category.name[locale])}
                          className={cn(
                            "flex h-full w-full flex-col items-center gap-2 rounded-2xl bg-card px-2 pt-4 pb-3 text-center ring-1 ring-foreground/5 transition-[scale] active:scale-95 motion-reduce:transition-none",
                            !count && "opacity-60",
                          )}
                        >
                          <CategoryAvatar
                            icon={category.icon}
                            className="size-12 [&_svg]:size-6"
                          />
                          <span className="line-clamp-2 text-xs leading-tight font-medium">
                            {category.name[locale]}
                          </span>
                          <span className="mt-auto text-[11px] text-muted-foreground">
                            {t.plural(count, {
                              one: "{{count}} place",
                              other: "{{count}} places",
                            })}
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </section>
          </>
        )}
      </main>
    </>
  );
}

/**
 * When the search is a category's name: its subcategories (with places) as
 * chips to narrow it down. On a subcategory: its siblings, with the parent
 * as "All" to widen it again. Each chip searches for that name.
 */
function SubcategoryChips({
  query,
  counts,
  onPick,
}: {
  query: string;
  counts: Record<string, number>;
  onPick: (name: string) => void;
}) {
  const { t, locale } = useLocale();
  const q = query.toLocaleLowerCase();
  const named = (test: (name: string) => boolean) =>
    ALL_CATEGORIES.find((c) =>
      Object.values(c.name).some((name) => test(name.toLocaleLowerCase())),
    );
  // The exact name, else the first that starts with it ("beauty").
  const match = named((n) => n === q) ?? named((n) => n.startsWith(q));
  if (!match) return null;
  const parent = match.children.length
    ? match
    : match.parent
      ? categoryOf(match.parent)
      : undefined;
  const children = parent?.children.filter((c) => counts[c.slug]) ?? [];
  if (!parent || !children.length) return null;

  const chips = [
    { category: parent, label: t("All") },
    ...children.map((c) => ({ category: c, label: c.name[locale] })),
  ];
  return (
    <nav
      aria-label={t("Subcategories")}
      className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pt-4 [scrollbar-width:none]"
    >
      {chips.map(({ category, label }) => {
        const current = category.slug === match.slug;
        return (
          <Button
            key={category.slug}
            variant={current ? "default" : "outline"}
            aria-current={current ? "true" : undefined}
            onClick={() => current || onPick(category.name[locale])}
            className="h-9 shrink-0 snap-start gap-1.5 rounded-full ps-2 pe-3 text-xs"
          >
            <HugeiconsIcon icon={category.icon} className="size-4" />
            {label}
            <span className="text-[11px] opacity-60 tabular-nums">
              {counts[category.slug] ?? 0}
            </span>
          </Button>
        );
      })}
    </nav>
  );
}
