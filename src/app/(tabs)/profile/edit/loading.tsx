import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { Bone, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/** Edit profile while loading: the avatar, the fields. */
export default async function EditProfileLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader title={t("Edit profile")} back={href("profile")} />
      <SkeletonBody label={t("Loading")} className="gap-6 pt-4">
        <div className="flex flex-col items-center gap-2">
          <Bone className="size-24 rounded-full" />
          <Bone className="h-4 w-32" />
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Bone className="h-4 w-20" />
            <Bone className="h-11 w-full rounded-xl" />
          </div>
        ))}
        <Bone className="h-24 w-full rounded-xl" />
      </SkeletonBody>
    </Screen>
  );
}
