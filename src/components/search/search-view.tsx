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
import { StackLink } from "@/components/navigation/stack-link";
import { BusinessList } from "@/components/profile/business-list";
import type { BusinessSummary } from "@/lib/business";
import { StatusScreen } from "@/components/status-screen";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { CATEGORIES } from "@/lib/categories";
import { useLocale } from "@/lib/i18n/provider";
import { useRecentSearches } from "@/lib/recent-searches";
import { href } from "@/lib/routes";

import { searchBusinesses } from "./actions";

/**
 * Search screen: field focused on open (keyboard "search" key), recent
 * searches kept on the device, and the top-level categories — tapping one
 * opens it (its businesses, and its subcategories to narrow down). A search matches businesses by name, handle, category and
 * description (on the server). While searching, the field starts with a
 * back arrow that returns here (a spinner while results load); the clear
 * button only empties the field.
 * The current search lives in the URL (`?q=`, replaced, not pushed): open
 * a result and come back, and the search is still there. `initial*` is
 * that search rendered on the server (a reload or a shared link); coming
 * back, the router may restore Search without it, so the URL wins.
 */
export function SearchView({
  initialQuery,
  initialResults,
}: {
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
          <InputGroup className="h-11 rounded-xl">
            <InputGroupAddon>
              {isPending ? (
                <Spinner aria-label={t("Searching…")} className="size-5" />
              ) : searching ? (
                <InputGroupButton
                  size="icon-xs"
                  className="-ms-1 size-8 rounded-full"
                  aria-label={t("Exit search")}
                  onClick={exit}
                >
                  <HugeiconsIcon
                    icon={ArrowLeft01Icon}
                    strokeWidth={2}
                    className="rtl:rotate-180"
                  />
                </InputGroupButton>
              ) : (
                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
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
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  className="size-8 rounded-full"
                  aria-label={t("Clear search")}
                  onClick={clearField}
                >
                  <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
        </form>
      </AppHeader>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
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
                        className="flex min-h-12 min-w-0 flex-1 items-center gap-3 ps-4 text-start text-sm"
                      >
                        <HugeiconsIcon
                          icon={Clock01Icon}
                          strokeWidth={2}
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
                        <HugeiconsIcon
                          icon={Cancel01Icon}
                          strokeWidth={2}
                          className="size-4"
                        />
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
              <ul className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((category) => (
                  <li key={category.slug}>
                    <StackLink
                      href={href("category", { params: { slug: category.slug } })}
                      className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-card px-3 py-2 text-start text-sm font-medium ring-1 ring-foreground/5"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <HugeiconsIcon
                          icon={category.icon}
                          strokeWidth={1.75}
                          className="size-5"
                        />
                      </span>
                      <span className="min-w-0 leading-tight">
                        {category.name[locale]}
                      </span>
                    </StackLink>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </>
  );
}
