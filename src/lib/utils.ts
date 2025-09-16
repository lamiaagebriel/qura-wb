import { unstable_cache as next_unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { cache } from "react";

import { HandleServerActionOnSubmit, HandleServerActionOptions } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { DateArg, format, formatDistanceToNow, FormatOptions } from "date-fns";
import * as DateFnsLocale from "date-fns/locale";
import { generateId } from "lucia";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

import { Locale } from "./locale";

export const ID = {
  generate: (props?: { len?: number }) => generateId(props?.len ?? 21),
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getURL(path: string = "") {
  // Check if NEXT_PUBLIC_SITE_URL is set and non-empty. Set this to your site URL in production env.
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL &&
    process.env.NEXT_PUBLIC_SITE_URL.trim() !== ""
      ? process.env.NEXT_PUBLIC_SITE_URL
      : // If not set, check for NEXT_PUBLIC_VERCEL_URL, which is automatically set by Vercel.
        process?.env?.NEXT_PUBLIC_VERCEL_URL &&
          process.env.NEXT_PUBLIC_VERCEL_URL.trim() !== ""
        ? process.env.NEXT_PUBLIC_VERCEL_URL
        : // If neither is set, default to localhost for local development.
          "http://localhost:3000/";

  // Trim the URL and remove trailing slash if exists.
  url = url.replace(/\/+$/, "");
  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`;
  // Ensure path starts without a slash to avoid double slashes in the final URL.
  path = path.replace(/^\/+/, "");

  // Concatenate the URL and the path.
  return path ? `${url}/${path}` : url;
}
export function fileToBase64(file: File): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => resolve(reader?.result);
    reader.onerror = (error) => reject(error);
  });
}
export function base64ToBuffer(base64: string) {
  const r = base64?.split(",")?.pop();
  if (!r) throw Error("NO BASE64");

  return Buffer.from(r, "base64");
}
export function getMimeType(base64: string) {
  const r = base64?.split(",")[0];
  if (!r) throw Error("NO MIME TYPE");

  const regex = /^data:(.*?);base64,/;
  const match = base64?.match(regex)!;

  return match[1] ?? null;
}

export async function handleServerAction<R>(
  actionFn: HandleServerActionOnSubmit<R>,
  options?: HandleServerActionOptions<R>
) {
  const result =
    typeof actionFn === "function" ? await actionFn() : await actionFn;

  if (!result) return;

  if (!result.ok) {
    if ("zodIssues" in result && Array.isArray(result?.zodIssues)) {
      if (!options?.form) {
        if (process.env.NODE_ENV !== "production")
          throw new Error("form is missing in handleServerAction.");

        return;
      }

      result?.zodIssues?.forEach((e) => {
        const path = e?.path?.join(".");
        if (!path) return toast.error(e?.message!);

        options?.form?.setError(path as any, { message: e?.message! });
      });
    }

    if ("message" in result && typeof result?.message === "string") {
      toast.error(result?.message);
    }
    options?.onError?.(result);
  }

  if (result.ok) {
    options?.onSuccess?.(result);
    if (result?.toast) toast[result?.toast?.type]?.(result?.toast?.message);

    if (result?.redirect) redirect(result?.redirect);
  }
}

// next_unstable_cache doesn't handle deduplication, so we wrap it in React's cache
export const unstable_cache = <Inputs extends unknown[], Output>(
  callback: (...args: Inputs) => Promise<Output>,
  key?: string[],
  options?: {
    revalidate?: number | false;
    tags?: string[];
  }
) =>
  cache(
    next_unstable_cache(callback, key, {
      revalidate: 60 * 60 * 2, // two hours
      ...options,
    })
  );

type FormatDateOptions = {
  formatStr?: string;
  type?: "default" | "distance";
} & Omit<FormatOptions, "locale">;

export function formatDate(
  date: DateArg<Date>,
  {
    type,
    locale: _locale = "en",
    formatStr: _formatStr,
    ...opts
  }: FormatDateOptions & { locale: Locale }
) {
  const locale = _locale === "ar" ? DateFnsLocale.arSA : DateFnsLocale?.enUS;
  const formatStr = _locale === "ar" ? "dd MMMM yyyy" : "PPP";

  if (!date) return null;

  if (type === "distance")
    return formatDistanceToNow(date, {
      locale,
      // roundingMethod: "floor", // Ensure intervals are rounded down
      // unit: "auto", // Automatically switch between s, m, h, d, etc.
      includeSeconds: true,
      addSuffix: true,
    });

  return format(date, formatStr, {
    locale,
    ...opts,
  });
}

export function formatPrice(
  amount: number | string | null,
  props: Intl.NumberFormatOptions = {
    currency: "EGP",
  }
) {
  if (!amount) return null;
  return formatNumber(amount, {
    style: "currency",
    // currencyDisplay: "name",
    ...props,
  });
}

export function formatNumber(
  number: number | string,
  props?: Intl.NumberFormatOptions
) {
  if (Number.isNaN(number)) return null;

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...props,
  }).format(Number(number));
}
