"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/lib/i18n/client";
import { Locale, LOCALE_META, LOCALES } from "@/lib/i18n/config";

/**
 * LocaleSwitcher — now uses a Select to select language.
 */
export function LocaleSwitcher() {
  const { locale, changeLocale, isPending } = useLocale();

  return (
    <Select
      value={locale}
      onValueChange={(val: Locale) => {
        if (!isPending && val !== locale) changeLocale(val);
      }}
      disabled={isPending}
    >
      <SelectTrigger aria-label="Select language">
        <SelectValue placeholder="Language">
          <span className="flex items-center gap-1.5">
            <img
              src={`https://flagcdn.com/16x12/${LOCALE_META[locale].flag}.png`}
              alt=""
              className="mr-1 inline-block h-3 w-4 object-contain object-center align-middle"
            />

            <span>{LOCALE_META[locale].label}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {LOCALES.map((l) => (
            <SelectItem
              key={l}
              value={l}
              disabled={isPending}
              className={l === locale ? "text-primary font-semibold" : ""}
              aria-selected={l === locale}
            >
              <span className="flex items-center gap-1.5">
                <img
                  src={`https://flagcdn.com/16x12/${LOCALE_META[l].flag}.png`}
                  alt=""
                  className="mr-1 inline-block h-3 w-4 object-contain object-center align-middle"
                />{" "}
                <span>{LOCALE_META[l].label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
