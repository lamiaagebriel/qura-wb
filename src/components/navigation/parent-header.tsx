"use client";

import { usePathname } from "next/navigation";

import { AppHeader } from "@/components/app-header";

/**
 * An `AppHeader` whose back arrow goes one level up the current address
 * (`/bs/x/reviews` → `/bs/x`). For `loading.tsx` screens, which don't get
 * the page's params but should still go back to the right parent.
 */
export function ParentHeader({ title }: { title: string }) {
  const pathname = usePathname();
  const parent = pathname.replace(/\/[^/]+\/?$/, "") || "/";
  return <AppHeader title={title} back={parent} />;
}
