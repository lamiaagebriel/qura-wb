import { AdminPage } from "@/components/admin/admin-page";
import { Bone } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";

/** Any dashboard screen while it loads: a header, filters and table rows. */
export default async function AdminLoading() {
  const { t } = await getTranslations();
  return (
    <AdminPage title={t("Admin")}>
      <div role="status" aria-label={t("Loading")} className="flex flex-col gap-3">
        <div className="flex justify-between gap-3">
          <Bone className="h-9 w-64 rounded-full" />
          <Bone className="hidden h-9 w-72 md:block" />
        </div>
        {Array.from({ length: 8 }, (_, i) => (
          <Bone key={i} className="h-12 w-full" />
        ))}
      </div>
    </AdminPage>
  );
}
