"use client";

import { Download04Icon } from "@/components/icons";
import { useInstallPrompt } from "@/components/install-prompt";
import { SettingsRow } from "@/components/settings-row";
import { useLocale } from "@/lib/i18n/provider";

/** Settings row: open the install sheet. Hidden when already installed or
 * when this browser can't install. */
export function InstallAppButton() {
  const { t } = useLocale();
  const { canInstall, open } = useInstallPrompt();
  if (!canInstall) return null;

  return <SettingsRow label={t("Install Qura")} icon={Download04Icon} onClick={open} />;
}
