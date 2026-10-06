import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { Bone, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/** Admin while loading: a section title and two cards. */
export default async function AdminLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader title={t("Admin")} back={href("profile")} />
      <SkeletonBody label={t("Loading")} className="gap-3 pt-2">
        <Bone className="h-5 w-40" />
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/5"
          >
            <Bone className="h-4 w-36" />
            <Bone className="h-3 w-24" />
            <div className="flex gap-2">
              <Bone className="h-11 flex-1 rounded-xl" />
              <Bone className="h-11 flex-1 rounded-xl" />
            </div>
          </div>
        ))}
      </SkeletonBody>
    </Screen>
  );
}
