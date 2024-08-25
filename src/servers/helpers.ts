"use server";

import { hash as Hash, verify as Verify } from "@node-rs/argon2";

import { i18n } from "@/lib/locale";
import { Locale } from "@/types/locale";
import { headers } from "next/headers";

export async function getLocale() {
  const refererUrl = headers().get("referer");
  let locale: string = i18n?.["defaultLocale"];

  if (refererUrl) {
    const url = new URL(refererUrl);
    const pathname = url.pathname;

    const match = pathname.match(/^\/([a-zA-Z-]{2,5})\//);
    if (match) locale = match[1];
  }

  return locale as Locale;
}

export async function hash(str: string) {
  return Hash(str, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

export async function verify(hashed: string, notHashed: string) {
  return Verify(hashed, notHashed, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}
