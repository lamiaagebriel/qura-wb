import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { PostFormSkeleton, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/** New post while loading: the form's type pills, text box and button. */
export default async function NewPostLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader title={t("New post")} back={href("home")} />
      <SkeletonBody label={t("Loading")} className="pt-2">
        <PostFormSkeleton />
      </SkeletonBody>
    </Screen>
  );
}
