// Pieces shared by the personal and business heroes. Each hero lays them
// out itself (personal-hero.tsx, business-hero.tsx), so the two can change
// independently; change a piece here only when both should change.

import type { ReactNode } from "react";

import {
  CheckmarkBadge01Icon,
  HugeiconsIcon,
  type IconSvgElement,
} from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { getTranslations } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/types";

import type { ProfileData } from "./fake-profile";

/** Avatar on the start side, name / handle / counts next to it. */
export function HeroTop({
  profile,
  name,
  fallbackIcon,
  children,
}: {
  profile: ProfileData;
  /** The name shown (a business: in the app language). */
  name: string;
  /** Shown in the avatar when there's no picture (instead of initials). */
  fallbackIcon?: IconSvgElement;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4">
      <ProfileAvatar
        profile={profile}
        name={name}
        fallbackIcon={fallbackIcon}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">{children}</div>
    </div>
  );
}

function ProfileAvatar({
  profile,
  name,
  fallbackIcon,
}: {
  profile: ProfileData;
  name: string;
  fallbackIcon?: IconSvgElement;
}) {
  return (
    <Avatar className="size-20 shrink-0 ring-1 ring-foreground/10">
      {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}
      <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
        {fallbackIcon ? (
          <HugeiconsIcon
            icon={fallbackIcon}
            strokeWidth={1.75}
            className="size-9"
          />
        ) : (
          initials(name)
        )}
      </AvatarFallback>
    </Avatar>
  );
}

/** The page header shows the name once this has scrolled away. */
export const PROFILE_NAME_ID = "profile-name";

export function ProfileName({
  profile,
  name,
  verifiedLabel,
}: {
  profile: ProfileData;
  name: string;
  verifiedLabel: string;
}) {
  return (
    <h2
      id={PROFILE_NAME_ID}
      className="flex min-w-0 items-center gap-1 text-xl leading-tight font-bold"
    >
      {/* User-written text follows its own direction (English bio in Arabic UI…). */}
      <span dir="auto" className="truncate">
        {name}
      </span>
      {profile.verified && (
        <HugeiconsIcon
          icon={CheckmarkBadge01Icon}
          strokeWidth={2}
          role="img"
          aria-label={verifiedLabel}
          className="size-5 shrink-0 text-primary"
        />
      )}
    </h2>
  );
}

// Stands in for the number while the sentence is split around it.
const NUMBER = "\u0001";

/**
 * "12.8K followers" / "1 follower" — the right plural form for `count` in
 * the app language, with the number (as `shown`, e.g. compact) in bold and
 * wherever the language puts it.
 */
export async function Count({
  count,
  shown,
  english,
}: {
  count: number;
  shown: string;
  /** The English forms; `other` is the translation key. */
  english: { one: string; other: MessageKey };
}) {
  const { t } = await getTranslations();
  const [before, after = ""] = t
    .plural(count, english, { count: NUMBER })
    .split(NUMBER);
  return (
    <span>
      {before}
      <span className="font-bold text-foreground tabular-nums">{shown}</span>
      {after}
    </span>
  );
}

export function Bio({ text }: { text: string }) {
  if (!text) return null;
  return (
    <p
      dir="auto"
      className="text-start text-sm leading-relaxed whitespace-pre-line"
    >
      {text}
    </p>
  );
}

/** Compact counts, in the app language ("12.8K", "١٢٫٨ ألف"). */
export const compactNumber = (locale: string) =>
  new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
