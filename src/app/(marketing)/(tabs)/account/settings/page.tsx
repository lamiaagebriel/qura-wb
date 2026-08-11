import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  DocumentValidationIcon,
  Edit02Icon,
  GlobeIcon,
  InformationCircleIcon,
  Logout01Icon,
  MoonIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { ModeSwitcher } from "@/components/mode-switcher";
import { AppHeader } from "@/components/app-header";
import { SettingsControlRow } from "@/components/settings-control-row";
import { signOutAction } from "@/lib/auth/actions/sign-out";
import { getGuardedUser } from "@/lib/auth/guard";
import { getLocale } from "@/lib/i18n/actions";
import { LocaleSwitcher } from "@/lib/i18n/client";

import { SettingsRow } from "./settings-row";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Settings")} — Qura` };
}

export default async function SettingsPage() {
  const user = await getGuardedUser();
  if (!user) redirect("/login");

  const { t } = await getLocale();

  return (
    <div className="flex flex-col gap-6">
      <AppHeader title={t("Settings")} />

      <div className="container flex flex-col px-4">
        <SettingsRow
          icon={Edit02Icon}
          label={t("Edit profile")}
          href="/account/edit"
        />
        <SettingsControlRow
          icon={GlobeIcon}
          label={t("Language")}
          trailing={<LocaleSwitcher />}
        />
        <SettingsControlRow
          icon={MoonIcon}
          label={t("Theme")}
          trailing={<ModeSwitcher />}
        />{" "}
      </div>

      <div className="container flex flex-col px-4">
        <SettingsControlRow
          icon={InformationCircleIcon}
          label={t("About the app")}
          last
        />
        <SettingsRow
          icon={UserAdd01Icon}
          label={t("Invite friends")}
          href="/account/settings/invite"
        />
        <SettingsRow
          icon={Alert02Icon}
          label={t("Report a problem")}
          href="/account/settings/report-problem"
        />
        <SettingsRow
          icon={DocumentValidationIcon}
          label={t("Privacy Policy")}
          href="/account/settings/privacy-policy"
          last
        />
      </div>

      <div className="container px-4">
        <form action={signOutAction}>
          <Button
            type="submit"
            variant="outline"
            className="text-destructive w-full"
          >
            <HugeiconsIcon icon={Logout01Icon} />
            {t("Log out")}
          </Button>
        </form>
      </div>
    </div>
  );
}
