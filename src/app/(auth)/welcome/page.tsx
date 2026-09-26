import type { Metadata } from "next";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { safeNext } from "@/lib/auth/redirect";
import { ensurePersonalProfile, requireUser } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n/server";
import { getPersonalProfile } from "@/lib/profiles/queries";
import { href } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("Welcome to Qura") };
}

/** First stop after a brand-new Google sign-up, then on to `next`. */
export default async function WelcomePage({
  searchParams,
}: PageProps<"/welcome">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);

  const user = await requireUser(href("welcome", { query: { next } }));
  const [{ t }, existing] = await Promise.all([
    getTranslations(),
    getPersonalProfile(user.id),
  ]);

  // Safety net: the sign-up hook normally creates it; if that failed,
  // create it now (first page every new user lands on).
  let profile = existing;
  if (!profile) {
    await ensurePersonalProfile(user.id);
    profile = await getPersonalProfile(user.id);
  }

  const name = profile?.displayName ?? user.name;
  const image = profile?.image ?? user.image;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-[max(env(safe-area-inset-top),3rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center animate-in fade-in zoom-in-95 duration-500 motion-reduce:animate-none">
        <Avatar className="size-20">
          {image && <AvatarImage src={image} alt="" />}
          <AvatarFallback className="text-2xl">{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">
            {t("Welcome to Qura")}
          </h1>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground" dir="ltr">
            @{profile?.username ?? user.username}
          </p>
        </div>
        <p className="text-sm text-balance text-muted-foreground">
          {t("Your profile is ready. This is how people will find you.")}
        </p>
      </div>

      <Button
        className="h-12 w-full rounded-xl"
        nativeButton={false}
        render={<Link href={next} />}
      >
        {t("Continue")}
      </Button>
    </main>
  );
}
