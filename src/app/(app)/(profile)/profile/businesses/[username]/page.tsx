import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { BusinessForm } from "@/components/profile/business-form";
import { requireUser } from "@/lib/auth/session";
import { myOpenBusinessRequest } from "@/lib/data/tickets";
import { categoryCounts, getMyBusiness } from "@/lib/data/businesses";
import { businessToForm } from "@/lib/business";
import { canDelete } from "@/lib/business-status";
import { env } from "@/lib/env";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("Edit business"), robots: { index: false, follow: true } };
}

/** Edit one of your businesses: the same form as adding one, filled. */
export default async function EditBusinessPage({
  params,
}: PageProps<"/profile/businesses/[username]">) {
  const { username } = await params;
  const [{ t }, user] = await Promise.all([
    getTranslations(),
    requireUser(href("editBusiness", { params: { username } })),
  ]);
  const mine = await getMyBusiness(decodeURIComponent(username), user.id);
  if (!mine) notFound();
  const role =
    user.role === "super_admin"
      ? "admin"
      : mine.ownedByMe
        ? "owner"
        : "creator";

  return (
    <Screen>
      <AppHeader title={t("Edit business")} back={href("businesses")} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4">
        <BusinessForm
          initial={{
            ...businessToForm(
              mine.business,
              mine.ownedByMe ? "me" : "someone-else",
            ),
            status: mine.status,
          }}
          editing={mine.business.username}
          // Only whoever added it picks its owner.
          canChooseOwner={mine.createdByMe}
          mapsApiKey={env.GOOGLE_MAPS_API_KEY ?? null}
          categoryCounts={await categoryCounts()}
          deletable={canDelete(role, mine.hasOwner)}
          status={{
            role,
            openRequest: await myOpenBusinessRequest(mine.id, user.id),
          }}
        />
      </main>
    </Screen>
  );
}
