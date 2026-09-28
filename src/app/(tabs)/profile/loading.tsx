import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { Bone, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";

/** Profile while loading: avatar, name and handle. */
export default async function ProfileLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader
        title={t("Profile")}
        large
        action={<Bone className="m-2.5 size-6 rounded-full" />}
      />
      <SkeletonBody label={t("Loading")} className="py-4">
        <div className="flex items-center gap-4">
          <Bone className="size-16 rounded-full" />
          <div className="flex flex-col gap-2">
            <Bone className="h-4 w-36" />
            <Bone className="h-3.5 w-24" />
          </div>
        </div>
      </SkeletonBody>
    </Screen>
  );
}
