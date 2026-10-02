import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { requireUser } from "@/lib/auth/session";
import { getGooglePhoto } from "@/lib/data/users";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("Edit profile"), robots: { index: false, follow: true } };
}

/** Edit your personal profile: avatar, name, @handle, bio. */
export default async function EditProfilePage() {
  const [{ t }, user] = await Promise.all([
    getTranslations(),
    requireUser(href("editProfile")),
  ]);
  const googlePhoto = await getGooglePhoto(user.id);

  return (
    <Screen>
      <AppHeader title={t("Edit profile")} back={href("profile")} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
        <EditProfileForm
          initial={{
            name: user.name,
            username: user.username,
            bio: user.bio ?? "",
            image: user.image ?? null,
          }}
          googlePhoto={googlePhoto}
        />
      </main>
    </Screen>
  );
}
