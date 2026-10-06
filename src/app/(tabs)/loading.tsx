import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { Bone, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";

/** Home while loading: banner, chips, two card rows and reviews, shown instantly on tap. */
export default async function HomeLoading() {
  const { t } = await getTranslations();
  const cards = (
    <div className="flex gap-3 overflow-hidden">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex w-36 shrink-0 flex-col gap-2 rounded-2xl bg-card p-3 ring-1 ring-foreground/5"
        >
          <Bone className="size-14 rounded-full" />
          <Bone className="h-3.5 w-24" />
          <Bone className="h-3 w-16" />
          <Bone className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
  return (
    <Screen>
      <AppHeader
        title={t("Qura")}
        large
        action={<Bone className="h-8 w-24 rounded-full" />}
      />
      <SkeletonBody label={t("Loading")} className="gap-6 pt-6 pb-8">
        <Bone className="aspect-[2/1] w-full rounded-2xl" />
        <div className="flex gap-2 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} className="h-5 w-20 shrink-0 rounded-full" />
          ))}
        </div>
        <Bone className="h-5 w-28" />
        {cards}
        <Bone className="h-5 w-32" />
        {cards}
      </SkeletonBody>
    </Screen>
  );
}
