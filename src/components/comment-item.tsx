import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * One comment-like item (a reply, a review), like Instagram's: photo, then
 * name · "You" · age with `actions` at the end of that line (your Edit |
 * Delete), the content (`children`: stars, text) and a `footer` (votes).
 * The writing side is `MessageField`. No hooks: server or client.
 */
export function CommentItem({
  label,
  name,
  image,
  fallback,
  you,
  createdAt,
  locale,
  actions,
  footer,
  highlighted = false,
  className,
  children,
}: {
  /** The item's accessible name ("Reply"). */
  label?: string;
  name: string;
  image?: string | null;
  /** In the avatar without a photo (a business's category icon); else the name. */
  fallback?: ReactNode;
  /** "You" when it's yours (translated by the caller), else nothing. */
  you?: string;
  createdAt: Date;
  locale: string;
  actions?: ReactNode;
  footer?: ReactNode;
  /** Being edited in the composer. */
  highlighted?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      aria-label={label}
      className={cn(
        "flex gap-3 py-3 transition-colors",
        highlighted && "bg-muted",
        className,
      )}
    >
      <Avatar className="size-9 shrink-0">
        {image && <AvatarImage src={image} alt="" />}
        <AvatarFallback>{fallback ?? name}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-h-6 min-w-0 items-center gap-1.5 text-xs">
          <bdi dir="auto" className="truncate font-semibold">
            {name}
          </bdi>
          {you && (
            <Badge variant="secondary" className="h-4.5 px-1.5">
              {you}
            </Badge>
          )}
          <time
            dateTime={createdAt.toISOString()}
            className="shrink-0 text-muted-foreground"
            suppressHydrationWarning
          >
            {timeAgo(createdAt, locale)}
          </time>
          {actions && <span className="-my-2 ms-auto shrink-0">{actions}</span>}
        </div>
        {children}
        {footer}
      </div>
    </article>
  );
}
