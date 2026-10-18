import type { ReactNode } from "react";

import {
  Bookmark01Icon,
  Comment01Icon,
  HugeiconsIcon,
  PinIcon,
  Shield01Icon,
  Store01Icon,
  type IconSvgElement,
} from "@/components/icons";
import { InstallAppButton } from "@/components/install-app-button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ModeSwitcher } from "@/components/mode-switcher";
import { StackLink } from "@/components/navigation/stack-link";
import { ShareAppButton } from "@/components/share-app-button";
import { SignOutButton } from "@/components/sign-out-button";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/** Same look as the other rows (`SettingsRow`), but it opens a screen. */
function LinkRow({
  href,
  label,
  icon,
  value,
}: {
  href: string;
  label: string;
  icon: IconSvgElement;
  value?: string;
}) {
  return (
    <StackLink
      href={href}
      className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-2 text-start"
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="flex items-center gap-2">
        {value && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {value}
          </span>
        )}
        <HugeiconsIcon
          icon={icon}
          strokeWidth={2}
          className="size-5 text-muted-foreground"
        />
      </span>
    </StackLink>
  );
}

/** One card of rows, like a group in a native settings list. */
function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5"
    >
      {children}
    </div>
  );
}

/**
 * The settings under your profile, grouped like a native settings list:
 * when signed in, what you run (My businesses, Place requests, Admin for
 * admins), then what you posted and kept (My posts, Saved posts); then the
 * app (language, theme, share, install), then Sign out.
 */
export async function SettingsList({
  signedIn,
  businessCount = 0,
  adminCount,
  postCount,
  savedCount,
}: {
  signedIn: boolean;
  businessCount?: number;
  /** Admins only: what waits for them (shows the Admin row). */
  adminCount?: number;
  /** Posts you wrote, and posts you saved (signed in). */
  postCount?: number;
  savedCount?: number;
}) {
  const { t, locale } = await getTranslations();
  const number = new Intl.NumberFormat(locale);

  return (
    <section aria-label={t("Settings")} className="flex flex-col gap-6 pb-8">
      {signedIn && (
        <Group label={t("Account")}>
          <LinkRow
            href={href("businesses")}
            label={t("My businesses")}
            icon={Store01Icon}
            value={number.format(businessCount)}
          />
          <LinkRow
            href={href("myPlaces")}
            label={t("Place requests")}
            icon={PinIcon}
          />
          {adminCount !== undefined && (
            <LinkRow
              href={href("admin")}
              label={t("Admin")}
              icon={Shield01Icon}
              value={number.format(adminCount)}
            />
          )}
        </Group>
      )}

      {signedIn && (
        <Group label={t("Activity")}>
          <LinkRow
            href={href("myPosts")}
            label={t("My posts")}
            icon={Comment01Icon}
            value={postCount === undefined ? undefined : number.format(postCount)}
          />
          <LinkRow
            href={href("saved")}
            label={t("Saved posts")}
            icon={Bookmark01Icon}
            value={savedCount === undefined ? undefined : number.format(savedCount)}
          />
        </Group>
      )}

      <Group label={t("App")}>
        <LocaleSwitcher />
        <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-2">
          <span className="text-sm font-medium">{t("Theme")}</span>
          <ModeSwitcher />
        </div>
        <ShareAppButton />
        <InstallAppButton />
      </Group>

      {signedIn && <SignOutButton size="xl" className="w-full rounded-xl" />}
    </section>
  );
}
