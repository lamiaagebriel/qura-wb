import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return {
    title: `${t("Explore")} — Qura`,
    description: t("Find trusted businesses and services around you."),
  };
}

export default async function ExploreHomePage() {
  return (
    <div className="flex flex-col gap-6 py-4">
      <h1>Feed</h1>
    </div>
  );
}
