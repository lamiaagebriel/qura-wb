import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { Bone, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/** Request a place while loading: the form's fields and button. */
export default async function NewPlaceLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader title={t("Request a place")} back={href("myPlaces")} />
      <SkeletonBody label={t("Loading")} className="gap-5 pt-2">
        <Bone className="h-10 w-full" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Bone className="h-4 w-24" />
            <Bone className="h-11 w-full rounded-xl" />
          </div>
        ))}
        <Bone className="h-24 w-full rounded-xl" />
        <Bone className="h-11 w-full rounded-xl" />
      </SkeletonBody>
    </Screen>
  );
}
