"use client";

import { HugeiconsIcon, TranslateIcon } from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isLocale, LOCALE_META, LOCALES } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/provider";

const items = LOCALES.map((l) => ({ value: l, label: LOCALE_META[l].label }));

export function LocaleSwitcher() {
  const { locale, setLocale, isPending, t } = useLocale();

  return (
    <Select
      items={items}
      value={locale}
      onValueChange={(value) => isLocale(value) && setLocale(value)}
      disabled={isPending}
    >
      {/* 44px touch target. */}
      <SelectTrigger aria-label={t("Select language")} className="h-11">
        <HugeiconsIcon icon={TranslateIcon} strokeWidth={2} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
