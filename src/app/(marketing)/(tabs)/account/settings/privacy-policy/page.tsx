import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { getLocale } from "@/lib/i18n/actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Privacy Policy")} — Qura` };
}

export default async function PrivacyPolicyPage() {
  const { t } = await getLocale();

  return (
    <div className="flex flex-col gap-6">
      <AppHeader title={t("Privacy Policy")} />
      <div className="container flex flex-col gap-4 px-4 pb-8 text-[13.5px] leading-relaxed">
        <p className="text-muted-foreground">
          {t(
            "This is a placeholder Privacy Policy. Qura is still in development — the real policy will be published here before launch.",
          )}
        </p>
      </div>
    </div>
  );
}
