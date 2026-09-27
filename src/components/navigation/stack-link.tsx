import Link from "next/link";
import type { ComponentProps } from "react";

import { NAV_FORWARD } from "@/lib/navigation";

/** A link that opens a deeper screen, sliding in from the end edge. */
export function StackLink(props: ComponentProps<typeof Link>) {
  return <Link transitionTypes={[NAV_FORWARD]} {...props} />;
}
