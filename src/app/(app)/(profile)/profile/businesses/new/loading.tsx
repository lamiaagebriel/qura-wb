import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { BusinessFormSkeleton, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/** New business while loading: the form. */
export default async function NewBusinessLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader title={t("New business")} back={href("businesses")} />
      <SkeletonBody label={t("Loading")} className="pt-2">
        <BusinessFormSkeleton />
      </SkeletonBody>
    </Screen>
  );
}
