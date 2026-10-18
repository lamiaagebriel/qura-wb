import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { PlaceRequestForm } from "@/components/places/place-request-form";
import { requireUser } from "@/lib/auth/session";
import { getCurrentPlace, getPlaceIndex, getPlaceTypes } from "@/lib/data/places";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("Request a place"), robots: { index: false } };
}

/** Asking for a place that isn't listed yet, under `?parent=` (or the one being browsed). */
export default async function NewPlacePage({
  searchParams,
}: PageProps<"/places/new">) {
  const [{ t }, { parent }, places, current, types] = await Promise.all([
    getTranslations(),
    searchParams,
    getPlaceIndex(),
    getCurrentPlace(),
    getPlaceTypes(),
  ]);
  const start = places.has(parent) ? parent : current;
  await requireUser(href("newPlace", { query: { parent: start } }));

  return (
    <Screen>
      <AppHeader title={t("Request a place")} back={href("myPlaces")} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
        <p className="pt-2 text-sm text-muted-foreground">
          {t("Can't find your place? Ask for it. Once it's approved, you'll help look after it.")}
        </p>
        <PlaceRequestForm parent={start} types={types} done={href("myPlaces")} />
      </main>
    </Screen>
  );
}
