"use client";

import { useEffect, useRef, useState } from "react";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  HugeiconsIcon,
} from "@/components/icons";
import { StackLink } from "@/components/navigation/stack-link";
import { overlaysSettled } from "@/components/navigation/use-back-to-close";
import { usePlaces } from "@/components/places/places-provider";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLocale } from "@/lib/i18n/provider";
import { placeName, type Place } from "@/lib/places";
import { href } from "@/lib/routes";
import { cn } from "@/lib/utils";

/**
 * A bottom sheet to pick a place in the tree, one level at a time: tap a
 * place to pick it (all of it, everything under it included), or its arrow
 * to see the places inside. Opens on the level of the current `value`.
 */
export function PlacePicker({
  open,
  onOpenChange,
  value,
  onSelect,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string | null;
  onSelect: (slug: string) => void;
  title: string;
}) {
  const { t, locale } = useLocale();
  const places = usePlaces();
  // The level shown: a place's id (its children), or null (the top).
  const startLevel = places.get(value)?.parentId ?? null;
  const [level, setLevel] = useState<string | null>(startLevel);
  // Back to the current value's level every time the sheet opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setLevel(startLevel);
  }

  const parent = places.getById(level);
  const rows = places.childrenOf(level);
  const name = (place: Place) => placeName(place, locale);
  const requestLink = useRef<HTMLAnchorElement>(null);
  // "Request it" waits for the sheet to close and drop its history entry
  // (a `history.back()`) — navigating before that, the back would undo it.
  const [requesting, setRequesting] = useState(false);
  useEffect(() => {
    if (!requesting || open) return;
    let cancelled = false;
    overlaysSettled().then(() => {
      if (cancelled) return;
      setRequesting(false);
      requestLink.current?.click();
    });
    return () => {
      cancelled = true;
    };
  }, [requesting, open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="flex-row items-center gap-1">
          {parent && (
            <Button
              variant="ghost"
              size="icon"
              className="-ms-2 size-11"
              aria-label={t("Back")}
              onClick={() => setLevel(parent.parentId)}
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                strokeWidth={2}
                className="size-5 rtl:rotate-180"
              />
            </Button>
          )}
          <DrawerTitle className="truncate">
            {parent ? name(parent) : title}
          </DrawerTitle>
        </DrawerHeader>
        <RadioGroup
          value={value ?? ""}
          onValueChange={(slug) => places.has(slug) && onSelect(slug)}
          aria-label={title}
          className="mx-4 mb-4 max-h-[calc(var(--app-height)*0.6)] w-auto gap-0 divide-y divide-border/60 overflow-y-auto"
        >
          {parent && (
            <Row value={parent.slug} label={t("All of {{city}}", { city: name(parent) })} strong />
          )}
          {rows.map((place) => {
            const inside = places.childrenOf(place.id).length > 0;
            return (
              <Row
                key={place.id}
                value={place.slug}
                label={name(place)}
                strong={!parent}
                hint={inside ? t("All of {{city}}", { city: name(place) }) : undefined}
                onOpen={inside ? () => setLevel(place.id) : undefined}
                openLabel={t("Places in {{city}}", { city: name(place) })}
              />
            );
          })}
        </RadioGroup>
        <button
          type="button"
          onClick={() => {
            setRequesting(true);
            onOpenChange(false);
          }}
          className="mx-4 mb-[calc(var(--safe-bottom)+1rem)] -mt-2 flex min-h-11 items-center justify-center text-sm font-medium text-primary"
        >
          {t("Can't find your place? Request it")}
        </button>
      </DrawerContent>
      {/* The real link (slides in), outside the sheet so it outlives it. */}
      <StackLink
        ref={requestLink}
        href={href("newPlace", { query: { parent: parent?.slug } })}
        hidden
        tabIndex={-1}
        aria-hidden
      />
    </Drawer>
  );
}

function Row({
  value,
  label,
  hint,
  strong,
  onOpen,
  openLabel,
}: {
  value: string;
  label: string;
  hint?: string;
  strong?: boolean;
  onOpen?: () => void;
  openLabel?: string;
}) {
  return (
    <div className="flex items-center">
      {/* The whole row is the label, so tapping anywhere selects it. */}
      <Label className="flex min-h-14 flex-1 cursor-pointer items-center justify-between gap-4 py-2 ps-1 pe-2">
        <span className="flex flex-col">
          <span className={cn("text-sm", strong ? "font-semibold" : "font-normal")}>
            {label}
          </span>
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </span>
        <RadioGroupItem value={value} />
      </Label>
      {onOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label={openLabel}
          onClick={onOpen}
        >
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="size-4 text-muted-foreground rtl:rotate-180"
          />
        </Button>
      )}
    </div>
  );
}
