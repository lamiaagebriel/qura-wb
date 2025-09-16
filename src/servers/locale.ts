"use server";

import { cookies as nextCookies } from "next/headers";

import { createServerAction } from "@/servers/utils";
import { Locale } from "@/lib/locale";
import { Validation, validations } from "@/lib/validations";

const site = {
  ar: () => import("@/constants/ar").then((module) => module?.default),
  en: () => import("@/constants/en").then((module) => module?.default),
};

export const getDictionary = async () => {
  // Note: here I assume that middleware always makes sure that locale is in cookies.
  const cookies = await nextCookies();
  const locale = cookies.get("locale")?.value as Locale;

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
