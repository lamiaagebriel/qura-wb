"use client";

import { useState } from "react";

import { TranslateIcon } from "@/components/icons";
import { STATIC_ROW } from "@/components/list-row";
import { SettingsRow } from "@/components/settings-row";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { isLocale, LOCALE_META, LOCALES, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/provider";

/**
 * Settings row "Language" (same look as the other rows). Tapping it opens a
 * bottom sheet to pick the language; choosing one switches and closes it.
 */
export function LocaleSwitcher() {
  const { locale, setLocale, isPending, t } = useLocale();
  const [open, setOpen] = useState(false);

  const choose = (next: Locale) => {
    setOpen(false);
    if (next !== locale) setLocale(next);
  };

  return (
    <>
      <SettingsRow
        label={t("Language")}
        last={
          <span className="text-muted-foreground">
            {LOCALE_META[locale].label}
          </span>
        }
        icon={TranslateIcon}
        onClick={() => setOpen(true)}
        disabled={isPending}
        aria-haspopup="dialog"
      />

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("Select language")}</DrawerTitle>
          </DrawerHeader>
          <RadioGroup
            value={locale}
            onValueChange={(value) => isLocale(value) && choose(value)}
            aria-label={t("Language")}
            className="mx-4 w-auto gap-0 divide-y divide-border/60 overflow-hidden "
          >
            {LOCALES.map((l) => (
              // The whole row is the label, so tapping anywhere selects it.
              <Label
                key={l}
                className={cn(STATIC_ROW, "cursor-pointer")}
              >
                {/* Each name in its own language and direction. */}
                <span
                  lang={l}
                  dir={LOCALE_META[l].dir}
                  className="font-medium"
                >
                  {LOCALE_META[l].label}
                </span>
                <RadioGroupItem value={l} />
              </Label>
            ))}
          </RadioGroup>
        </DrawerContent>
      </Drawer>
    </>
  );
}
