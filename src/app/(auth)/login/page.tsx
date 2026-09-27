import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { safeNext } from "@/lib/auth/redirect";
import { getSession } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n/server";

import { GoogleSignIn } from "@/components/auth/google-sign-in";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("Sign in") };
}

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  const error = typeof params.error === "string" ? params.error : null;

  // Already signed in → straight to `next`. A suspended user stays here to
  // see the error (redirecting them would loop with `requireUser()`).
  const session = await getSession();
  if (session && session.user.status !== "suspended") redirect(next);

  const { t } = await getTranslations();

  return (
    <main className="mx-auto flex min-h-(--app-height) w-full max-w-md flex-col px-6 pt-[max(var(--safe-top),3rem)] pb-[max(var(--safe-bottom),1.5rem)]">
      <div className="flex flex-1 flex-col justify-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          {t("Qura")}
        </h1>
        <p className="text-base text-muted-foreground">
          {t(
            "Discover restaurants, events, jobs, apartments, and more — all in one local feed. Launching in Aswan, expanding worldwide.",
          )}
        </p>
      </div>

      <div className="flex flex-col gap-4 animate-in fade-in duration-700 motion-reduce:animate-none">
        <GoogleSignIn next={next} error={error} />
        <p className="text-center text-xs text-balance text-muted-foreground">
          {t("By continuing, you agree to our")} {t("Terms of Service")}{" "}
          {t("and")} {t("Privacy Policy")}.
        </p>
      </div>
    </main>
  );
}
