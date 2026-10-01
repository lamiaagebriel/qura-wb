import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { BusinessForm } from "@/components/profile/business-form";
import { requireUser } from "@/lib/auth/session";
import { EMPTY_BUSINESS } from "@/lib/business";
import { env } from "@/lib/env";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("New business"), robots: { index: false, follow: true } };
}

/** Add a business: the same form as editing, empty. */
export default async function NewBusinessPage() {
  const [{ t }] = await Promise.all([
    getTranslations(),
    requireUser(href("newBusiness")),
  ]);

  return (
    <Screen>
      <AppHeader title={t("New business")} back={href("businesses")} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
        {/* Whoever adds a business picks its owner. */}
        <BusinessForm
          initial={EMPTY_BUSINESS}
          editing={null}
          canChooseOwner
          mapsApiKey={env.GOOGLE_MAPS_API_KEY ?? null}
        />
      </main>
    </Screen>
  );
}
