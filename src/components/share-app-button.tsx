"use client";

import { Share08Icon } from "@/components/icons";
import { SettingsRow } from "@/components/settings-row";
import { useLocale } from "@/lib/i18n/provider";
import { href } from "@/lib/routes";
import { useShare } from "@/lib/share";

/** Settings row: share Qura via the phone's share sheet (or copy link). */
export function ShareAppButton() {
  const { t } = useLocale();
  const share = useShare();

  return (
    <SettingsRow
      label={t("Share Qura")}
      icon={Share08Icon}
      onClick={() =>
        share({
          title: t("Qura"),
          text: t("Your city, one feed."),
          url: href("home"),
        })
      }
    />
  );
}
