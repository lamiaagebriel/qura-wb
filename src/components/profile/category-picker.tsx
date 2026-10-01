"use client";

import { useMemo, useState } from "react";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  HugeiconsIcon,
  Search01Icon,
  Tick02Icon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  ALL_CATEGORIES,
  CATEGORIES,
  categoryOf,
  pathOf,
  type Category,
} from "@/lib/categories";
import { useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * Picks one category at any level of the tree. A sheet that drills down:
 * rows with children open them (a "Choose <name>" row on top picks that
 * level itself), rows without pick right away. The search field searches
 * the whole tree and shows each result with its path.
 */
export function CategoryPicker({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (slug: string) => void;
  invalid?: boolean;
}) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  // The category being browsed (`null`: the top level).
  const [at, setAt] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const current = at ? categoryOf(at) : undefined;
  const label = (c: Category) =>
    pathOf(c.slug)
      .reverse()
      .map((p) => p.name[locale])
      .join(" · ");

  const q = query.trim().toLocaleLowerCase();
  const results = useMemo(
    () =>
      q
        ? ALL_CATEGORIES.filter((c) =>
            Object.values(c.name).some((n) => n.toLocaleLowerCase().includes(q)),
          )
        : null,
    [q],
  );

  const choose = (slug: string) => {
    onChange(slug);
    setOpen(false);
  };

  const openSheet = () => {
    // Opens where the current choice is, so changing it is one tap away.
    const chosen = categoryOf(value);
    setAt(chosen ? (chosen.children.length ? chosen.slug : chosen.parent) : null);
    setQuery("");
    setOpen(true);
  };

  const chosen = categoryOf(value);
  const row =
    "flex min-h-14 w-full items-center gap-3 px-4 py-2 text-start text-base";

  const item = (c: Category, withPath = false) => (
    <li key={c.slug}>
      <button
        type="button"
        className={row}
        onClick={() =>
          c.children.length && !withPath ? setAt(c.slug) : choose(c.slug)
        }
      >
        <HugeiconsIcon icon={c.icon} strokeWidth={1.75} className="size-5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate">{withPath ? label(c) : c.name[locale]}</span>
        {c.slug === value && (
          <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-5 shrink-0 text-primary" />
        )}
        {c.children.length > 0 && !withPath && (
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"
          />
        )}
      </button>
    </li>
  );

  return (
    <>
      <Button
        id={id}
        type="button"
        variant="outline"
        aria-invalid={invalid}
        data-value={value}
        onClick={openSheet}
        className="h-11 w-full justify-between rounded-xl ps-3 text-base font-normal"
      >
        <span className={cn("truncate", !chosen && "text-muted-foreground")}>
          {chosen ? label(chosen) : t("Choose a category")}
        </span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={2}
          className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"
        />
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[85%] pb-[max(var(--safe-bottom),1rem)]">
          <DrawerHeader className="flex-row items-center gap-1">
            {current && !results && (
              <Button
                variant="ghost"
                size="icon"
                className="-ms-2 size-11 rounded-full"
                aria-label={t("Back")}
                onClick={() => setAt(current.parent)}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="rtl:rotate-180" />
              </Button>
            )}
            <DrawerTitle className="text-base">
              {current && !results ? current.name[locale] : t("Category")}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex min-h-0 flex-col gap-3 px-4">
            <InputGroup className="h-11 shrink-0 rounded-xl">
              <InputGroupAddon>
                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Search categories")}
                aria-label={t("Search categories")}
                enterKeyHint="search"
                autoComplete="off"
              />
            </InputGroup>
            <ul className="divide-y divide-border/60 overflow-y-auto rounded-2xl bg-card ring-1 ring-foreground/5">
              {results ? (
                results.length ? (
                  results.map((c) => item(c, true))
                ) : (
                  <li className="px-4 py-4 text-sm text-muted-foreground">
                    {t("No matching category")}
                  </li>
                )
              ) : (
                <>
                  {current && (
                    <li>
                      <button
                        type="button"
                        className={cn(row, "font-medium text-primary")}
                        onClick={() => choose(current.slug)}
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {t("Choose “{{name}}”", { name: current.name[locale] })}
                        </span>
                        {current.slug === value && (
                          <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-5 shrink-0" />
                        )}
                      </button>
                    </li>
                  )}
                  {(current?.children ?? CATEGORIES).map((c) => item(c))}
                </>
              )}
            </ul>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
