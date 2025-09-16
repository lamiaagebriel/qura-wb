"use server";

import { cookies as nextCookies } from "next/headers";

import { createServerAction } from "@/servers/utils";
import { ensureValidLocale } from "@/lib/locale";
import { Validation, validations } from "@/lib/validations";

const site = {
  ar: () => import("@/constants/ar").then((module) => module?.default),
  en: () => import("@/constants/en").then((module) => module?.default),
};

export const getDictionary = async () => {
  const cookies = await nextCookies();
  const cookieLocale = cookies.get("locale")?.value;
  // Ensure we always have a valid locale with fallback to default
  const locale = ensureValidLocale(cookieLocale);

  const dic = await site[locale]();
  return { locale, ...dic };
};

export const localeSwitcher = createServerAction(
  async (formData: Validation["locale-switcher"]) => {
    const { locale } = validations["locale-switcher"]?.parse(formData);

    const cookies = await nextCookies();
    cookies.set("locale", locale, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }
);
