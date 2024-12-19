import { redirect } from "next/navigation";

import {
  HandleServerActionOnSubmit,
  HandleServerActionOptions,
  ServerActionSuccess,
} from "@/types";
import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

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

export async function handleServerAction<R>(
  actionFn: HandleServerActionOnSubmit<R>,
  options?: HandleServerActionOptions<R>
) {
  const result =
    typeof actionFn === "function" ? await actionFn() : await actionFn;

  if (!result) return;

  if (!result.ok) {
    if ("zodIssues" in result && Array.isArray(result?.["zodIssues"])) {
      if (!options?.["form"]) {
        if (process.env.NODE_ENV !== "production")
          throw new Error("form is missing in handleServerAction.");

        return;
      }

      result?.["zodIssues"]?.forEach((e) => {
        const path = e?.["path"]?.join(".");
        if (!path) return toast.error(e?.["message"]!);

        options?.["form"]?.setError(path as any, { message: e?.["message"]! });
      });
    }

    if ("message" in result && typeof result?.["message"] === "string") {
      toast.error(result?.["message"]);
    }
    options?.onError?.(result);
  }

  if (result.ok) {
    options?.onSuccess?.(result);
    if (result?.toast)
      toast?.[result?.["toast"]?.["type"]]?.(result?.["toast"]?.["message"]);

    if (result?.redirect) redirect(result?.["redirect"]);
  }
}
