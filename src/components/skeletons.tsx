import type { ComponentProps, ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading placeholders that match real layouts (`loading.tsx` per screen).
 * `Bone` = one skeleton block; the pulse stops under reduced motion.
 */
export function Bone({ className, ...props }: ComponentProps<typeof Skeleton>) {
  return (
    <Skeleton
      className={cn("motion-reduce:animate-none", className)}
      {...props}
    />
  );
}

/** Screen body while loading: announced once to screen readers. */
export function SkeletonBody({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <main
      aria-busy
      className={cn("mx-auto flex w-full max-w-md flex-1 flex-col px-4", className)}
    >
      <span className="sr-only" role="status">
        {label}
      </span>
      <div aria-hidden className="contents">
        {children}
      </div>
    </main>
  );
}

/** A feed post: author row, two lines of text, a photo. */
export function PostSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-4">
      <div className="flex items-center gap-3">
        <Bone className="size-10 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Bone className="h-3.5 w-32" />
          <Bone className="h-3 w-20" />
        </div>
      </div>
      <Bone className="h-3.5 w-full" />
      <Bone className="h-3.5 w-4/5" />
      <Bone className="aspect-4/3 w-full rounded-xl" />
    </div>
  );
}

/**
 * A business profile (yours or someone else's): avatar + name, category
 * and followers, buttons, bio, and the details card (reviews, hours,
 * links, address rows, then the map).
 */
export function BusinessProfileSkeleton() {
  return (
    <>
      <div className="flex items-center gap-4">
        <Bone className="size-20 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Bone className="h-5 w-40" />
          <Bone className="h-3.5 w-32" />
          <Bone className="mt-1 h-3.5 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Bone className="h-11 rounded-xl" />
        <Bone className="h-11 rounded-xl" />
      </div>
      <div className="flex flex-col gap-2">
        <Bone className="h-3.5 w-full" />
        <Bone className="h-3.5 w-3/4" />
      </div>
      <div className="divide-y divide-border/60 overflow-hidden rounded-2xl ring-1 ring-foreground/5">
        {["w-28", "w-40", "w-32", "w-4/5"].map((width) => (
          <div key={width} className="flex h-11 items-center gap-3 px-4">
            <Bone className="size-5 shrink-0 rounded-full" />
            <Bone className={`h-3.5 ${width}`} />
          </div>
        ))}
        <Bone className="h-40 rounded-none" />
      </div>
    </>
  );
}

/** A grouped list card (settings, recent searches). */
export function ListCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex min-h-14 items-center justify-between gap-4 px-4">
          <Bone className="h-3.5 w-28" />
          <Bone className="size-5 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** The business form (`BusinessForm`): labelled fields, then the button. */
export function BusinessFormSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {["w-28", "w-36", "w-36", "w-20", "w-20", "w-12", "w-32"].map((width, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Bone className={`h-3.5 ${width}`} />
            <Bone className={i === 5 ? "h-24 rounded-xl" : "h-11 rounded-xl"} />
          </div>
        ))}
      </div>
      <Bone className="h-11 rounded-xl" />
    </div>
  );
}
