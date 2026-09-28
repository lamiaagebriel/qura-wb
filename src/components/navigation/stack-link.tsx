"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { useLocale } from "@/lib/i18n/provider";
import { navType } from "@/lib/navigation";

/** A link that opens a deeper screen, sliding in from the end edge. */
export function StackLink(props: ComponentProps<typeof Link>) {
  const { dir } = useLocale();
  // Full prefetch (see BackButton): the screen's data is ready before the
  // tap, so the slide animates the real destination in one commit.
  return <Link prefetch transitionTypes={[navType("forward", dir)]} {...props} />;
}
