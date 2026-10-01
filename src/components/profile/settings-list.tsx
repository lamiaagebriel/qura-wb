import { HugeiconsIcon, Store01Icon } from "@/components/icons";
import { InstallAppButton } from "@/components/install-app-button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ModeSwitcher } from "@/components/mode-switcher";
import { StackLink } from "@/components/navigation/stack-link";
import { ShareAppButton } from "@/components/share-app-button";
import { SignOutButton } from "@/components/sign-out-button";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/**
 * The settings under your profile, grouped like a native settings list.
 * Signed in, it starts with "My businesses" and ends with Sign out.
 */
export async function SettingsList({
  signedIn,
  businessCount = 0,
}: {
  signedIn: boolean;
  businessCount?: number;
}) {
  const { t, locale } = await getTranslations();

  return (
    <section aria-label={t("Settings")} className="flex flex-col gap-6 pb-8">
      <div className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
        {signedIn && (
          // Same look as the other rows (SettingsRow), but it opens a screen.
          <StackLink
            href={href("businesses")}
            className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-2 text-start"
          >
            <span className="text-sm font-medium">{t("My businesses")}</span>
            <span className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground tabular-nums">
                {new Intl.NumberFormat(locale).format(businessCount)}
              </span>
              <HugeiconsIcon
                icon={Store01Icon}
                strokeWidth={2}
                className="size-5 text-muted-foreground"
              />
            </span>
          </StackLink>
        )}
        <LocaleSwitcher />
        <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-2">
          <span className="text-sm font-medium">{t("Theme")}</span>
          <ModeSwitcher />
        </div>
        <ShareAppButton />
        <InstallAppButton />
      </div>

      {signedIn && <SignOutButton size="xl" className="w-full rounded-xl" />}
    </section>
  );
}
