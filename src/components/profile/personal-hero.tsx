import { getTranslations } from "@/lib/i18n/server";

import type { PersonalProfile } from "./fake-profile";
import { Bio, compactNumber, Count, HeroTop, ProfileName } from "./hero-parts";
import { ProfileActions } from "./profile-actions";

/**
 * Personal profile top: avatar, name, "Personal" · handle (where a
 * business shows its category), followers · following, bio,
 * then the owner's buttons. No details card (that's business only).
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
          {/* {t("Personal")}
          {" · "} */}
          <bdi dir="ltr">@{profile.username}</bdi>
        </p>
        <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
          <Count
            count={profile.stats.followers}
            shown={count.format(profile.stats.followers)}
            english={{
              one: "{{count}} follower",
              other: "{{count}} followers",
            }}
          />
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

      <ProfileActions name={profile.name} username={profile.username} />
    </>
  );
}
