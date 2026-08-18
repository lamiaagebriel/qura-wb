"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  Edit02Icon,
  Loading03FreeIcons,
  MoreHorizontal,
  SentIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import { loadMoreBusinessReviewsAction } from "@/lib/business/actions/load-more";
import {
  deleteReviewAction,
  upsertReviewAction,
} from "@/lib/business/actions/review";
import { handleAppError } from "@/lib/errors-client";
import { useLocale } from "@/lib/i18n/client";
import { cn, formatCompactRelativeTime } from "@/lib/utils";

type Review = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: Date;
  author: { id: string; name: string; username: string; image: string | null };
};

type MyReview = { id: string; rating: number; body: string | null };

function StarRating({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md";
}) {
  const [hover, setHover] = useState(0);
  const interactive = !!onChange;
  const shown = interactive && hover > 0 ? hover : value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          className={cn(!interactive && "cursor-default")}
        >
          <HugeiconsIcon
            icon={StarIcon}
            className={cn(
              size === "sm" ? "size-3.5" : "size-4",
              n <= shown ? "text-amber-400" : "text-muted-foreground/25",
            )}
            fill={n <= shown ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

/** Styled after `ComposeBox` — avatar + rounded pill input + inline send
 * button, so writing a review reads as the same "leave a comment"
 * action as replying to a thread, not a separate form. The one addition
 * a thread reply doesn't need is the star row above the pill. */
function ReviewComposer({
  businessId,
  user,
  initial,
  onDone,
}: {
  businessId: string;
  user: { name: string; image?: string | null } | null | undefined;
  initial: { rating: number; body: string } | null;
  onDone?: () => void;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [body, setBody] = useState(initial?.body ?? "");
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (rating === 0 || isPending) return;
    startTransition(async () => {
      const result = await upsertReviewAction(businessId, { rating, body });
      if (!result.success) {
        handleAppError(result.error);
        return;
      }
      toast.success(initial ? t("Review updated.") : t("Review submitted."));
      if (!initial) {
        setRating(0);
        setBody("");
      }
      router.refresh();
      onDone?.();
    });
  }

  return (
    <div className="flex gap-3 py-3">
      <Avatar>
        {user?.image && <AvatarImage src={user.image} alt={user.name} />}
        <AvatarFallback>{user?.name}</AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-col gap-1.5">
        <StarRating value={rating} onChange={setRating} />
        <InputGroup className="h-9 rounded-full">
          <InputGroupTextarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={1}
            maxLength={500}
            placeholder={t("Share details of your experience (optional)")}
            className="max-h-16 min-h-auto resize-none py-1.5 leading-6"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              size="icon-xs"
              aria-label={initial ? t("Update review") : t("Submit review")}
              disabled={rating === 0 || isPending}
              onClick={submit}
            >
              <HugeiconsIcon icon={SentIcon} className="size-4" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  );
}

function ReviewRow({
  review,
  isOwn,
  onEdit,
}: {
  review: Review;
  isOwn: boolean;
  onEdit: () => void;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, startDeleting] = useTransition();

  function handleDelete() {
    setConfirmDelete(false);
    startDeleting(async () => {
      const result = await deleteReviewAction(review.id);
      if (!result.success) {
        handleAppError(result.error);
        return;
      }
      toast.success(t("Review deleted."));
      router.refresh();
    });
  }

  return (
    <div className="border-border/60 flex gap-3 border-b py-3">
      <Avatar>
        {review.author.image && (
          <AvatarImage src={review.author.image} alt={review.author.name} />
        )}
        <AvatarFallback>{review.author.name}</AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-foreground text-[13.5px] font-semibold">
            {review.author.username}
          </span>
          <StarRating value={review.rating} size="sm" />
          <span className="text-muted-foreground text-xs">
            {formatCompactRelativeTime(review.createdAt, locale)}
          </span>
          {isOwn && (
            <button
              type="button"
              aria-label={t("More options")}
              onClick={() => setMenuOpen(true)}
              className="text-muted-foreground hover:text-foreground ms-auto"
            >
              <HugeiconsIcon icon={MoreHorizontal} className="size-4" />
            </button>
          )}
        </div>
        {review.body && (
          <p className="text-foreground text-[14px] leading-relaxed whitespace-pre-line">
            {review.body}
          </p>
        )}
      </div>

      {isOwn && (
        <>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>{t("Review options")}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col px-4 pb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit();
                  }}
                  className="border-border/60 flex items-center gap-3 border-b py-3.5"
                >
                  <HugeiconsIcon
                    icon={Edit02Icon}
                    className="text-foreground size-5 shrink-0"
                  />
                  <span className="text-foreground text-[14.5px] font-medium">
                    {t("Edit")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmDelete(true);
                  }}
                  className="flex items-center gap-3 py-3.5"
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    className="text-destructive size-5 shrink-0"
                  />
                  <span className="text-destructive text-[14.5px] font-medium">
                    {t("Delete")}
                  </span>
                </button>
              </div>
            </SheetContent>
          </Sheet>

          <Sheet open={confirmDelete} onOpenChange={setConfirmDelete}>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>{t("Delete this review?")}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 px-4 pb-6">
                <p className="text-muted-foreground -mt-2 mb-1 text-[13px] leading-relaxed">
                  {t("This can't be undone.")}
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={handleDelete}
                >
                  {t("Delete")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmDelete(false)}
                >
                  {t("Cancel")}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}

export function BusinessReviews({
  businessId,
  initialItems,
  initialCursor,
  summary,
  myReview,
  canReview,
  viewer,
}: {
  businessId: string;
  initialItems: Review[];
  initialCursor: number | null;
  summary: { average: number | null; count: number };
  myReview: MyReview | null;
  canReview: boolean;
  viewer?: { name: string; image?: string | null } | null;
}) {
  const { t } = useLocale();
  const [editing, setEditing] = useState(false);
  const { items, isLoading, hasMore, sentinelRef } = useInfiniteList<
    Review,
    number
  >({
    initialItems,
    initialCursor,
    fetchMore: (cursor) => loadMoreBusinessReviewsAction(businessId, cursor),
  });

  return (
    <div className="flex flex-col">
      {summary.count > 0 && (
        <div className="flex items-center gap-2 pb-3">
          <StarRating value={Math.round(summary.average ?? 0)} />
          <span className="text-foreground text-[13px] font-semibold">
            {summary.average?.toFixed(1)}
          </span>
          <span className="text-muted-foreground text-[12.5px]">
            ({summary.count})
          </span>
        </div>
      )}

      {canReview && (!myReview || editing) && (
        <ReviewComposer
          businessId={businessId}
          user={viewer}
          initial={
            editing && myReview
              ? { rating: myReview.rating, body: myReview.body ?? "" }
              : null
          }
          onDone={() => setEditing(false)}
        />
      )}

      {items.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-[13px]">
          {t("No reviews yet.")}
        </p>
      ) : (
        !editing &&
        items.map((review) => (
          <ReviewRow
            key={review.id}
            review={review}
            isOwn={myReview?.id === review.id}
            onEdit={() => setEditing(true)}
          />
        ))
      )}

      {!editing && hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {isLoading && (
            <HugeiconsIcon
              icon={Loading03FreeIcons}
              strokeWidth={2.5}
              className="size-4"
            />
          )}
        </div>
      )}
    </div>
  );
}
