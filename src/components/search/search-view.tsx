"use client";

import { useRef, useState } from "react";

import { AppHeader } from "@/components/app-header";
import {
  Cancel01Icon,
  Clock01Icon,
  HugeiconsIcon,
  Search01Icon,
} from "@/components/icons";
import { StatusScreen } from "@/components/status-screen";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useLocale } from "@/lib/i18n/provider";
import { useRecentSearches } from "@/lib/recent-searches";

/**
 * Search screen: field focused on open (keyboard "search" key), a clear
 * button, recent searches kept on the device, and designed empty states.
 * Results come later — for now a submitted search shows "no results".
 */
export function SearchView() {
  const { t } = useLocale();
  const { recent, add, remove, clear } = useRecentSearches();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const search = (value: string) => {
    const q = value.trim();
    if (!q) return;
    setQuery(q);
    setSubmitted(q);
    add(q);
    inputRef.current?.blur(); // dismiss the keyboard, like a native app
  };

  const clearField = () => {
    setQuery("");
    setSubmitted(null);
    inputRef.current?.focus();
  };

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
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              type="search"
              name="q"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (!event.target.value) setSubmitted(null);
              }}
              placeholder={t("Search Qura")}
              aria-label={t("Search Qura")}
              enterKeyHint="search"
              autoComplete="off"
              autoFocus
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
        {submitted ? (
          <StatusScreen
            icon={Search01Icon}
            title={t("No results for “{{query}}”", { query: submitted })}
            description={t("Try a different word or check the spelling.")}
            inline
          />
        ) : recent.length > 0 ? (
          <section aria-labelledby="recent-searches" className="flex flex-col gap-2 py-4">
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
                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <StatusScreen
            icon={Search01Icon}
            title={t("Search Qura")}
            description={t("Find places, events and people in your city.")}
            inline
          />
        )}
      </main>
    </>
  );
}
