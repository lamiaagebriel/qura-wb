import { getTranslations } from "@/lib/i18n/server";

import { Bio, compactNumber, Count, HeroTop, ProfileName } from "./hero-parts";

/** The signed-in user, as their own Profile tab shows them (never public). */
export type PersonalProfile = {
  name: string;
  username: string;
  avatarUrl: string | null;
  verified: boolean;
  bio: string;
  /** How many businesses they follow (users have no followers). */
  stats: { following: number };
};

/**
 * Personal profile top: avatar, name, handle (where a business shows its
 * category), how many businesses they follow, bio. No buttons (the
 * settings list has "Edit profile") and no details card (business only).
 */
export async function PersonalHero({ profile }: { profile: PersonalProfile }) {
  const { t, locale } = await getTranslations();
  const count = compactNumber(locale);

  return (
    <>
      <HeroTop profile={profile} name={profile.name}>
        <ProfileName
          profile={profile}
          name={profile.name}
          verifiedLabel={t("Verified")}
        />
        <p className="truncate text-sm text-muted-foreground">
          <bdi dir="ltr">@{profile.username}</bdi>
        </p>
        <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
          <Count
            count={profile.stats.following}
            shown={count.format(profile.stats.following)}
            english={{
              one: "{{count}} following",
              other: "{{count}} following",
            }}
          />
        </p>
      </HeroTop>

      <Bio text={profile.bio} />
    </>
  );
}
