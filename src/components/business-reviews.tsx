"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  Edit02Icon,
  Loading03FreeIcons,
  Location01Icon,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import { loadMoreBusinessReviewsAction } from "@/lib/business/actions/load-more";
import {
  deleteReviewAction,
  upsertReviewAction,
} from "@/lib/business/actions/review";
import { handleAppError } from "@/lib/errors-client";
import type { GooglePlaceReview } from "@/lib/google-places/types";
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

// One list, one row shape — a Qura review and a Google review render
// through the same `divide-y` list either way; this discriminated union
// is only what lets `ReviewListRow` below pick which fields/behavior
// apply, never a reason to show them differently at a glance. `id` is
// real (the review's own db id) for `"qura"`; Google's API gives reviews
// no stable id at all, so `"google"` synthesizes one from the place id +
// position — stable across a single page load, which is all
// `useInfiniteList`'s keying needs.
type ReviewListItem =
  | ({ kind: "qura" } & Review)
  | ({ kind: "google"; id: string } & GooglePlaceReview);

// `useInfiniteList`'s cursor: a plain number while Qura's own pages still
// have more, then the literal `"google"` for exactly one final
// synthetic page that reveals the (already fully in hand, never
// paginated) Google reviews — see `BusinessReviews`'s `fetchMore` below.
type ReviewsCursor = number | "google";

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
    <div className="container flex flex-col gap-3 py-3">
      <div className="flex gap-3">
        <Avatar>
          <AvatarImage src={user?.image!} alt={user?.name} />
          <AvatarFallback>{user?.name}</AvatarFallback>
        </Avatar>{" "}
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">{user?.name}</p>
          <StarRating value={rating} onChange={setRating} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
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
    <div>
      <div className="container flex gap-3 py-3">
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
    </div>
  );
}

// Same row markup/spacing as `ReviewRow` — a Google review reads as one
// more review in the same list, not a visibly distinct import. The one
// deliberate difference besides the small "Google" tag: never editable
// (no menu, no own-review affordance — this isn't Qura's data to edit),
// and the date is Google's own pre-localized string
// (`relativePublishTimeDescription`, e.g. "3 weeks ago") rather than run
// through `formatCompactRelativeTime`, since Google already localized it
// and `publishTime`'s exact format isn't documented enough to re-parse
// reliably.
function GoogleReviewRow({ review }: { review: GooglePlaceReview }) {
  const { t } = useLocale();
  return (
    <div>
      <div className="container flex gap-3 py-3">
        <Avatar>
          {review.authorPhotoUri && (
            <AvatarImage src={review.authorPhotoUri} alt={review.authorName} />
          )}
          <AvatarFallback>{review.authorName}</AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-foreground text-[13.5px] font-semibold">
              {review.authorName}
            </span>
            <StarRating value={review.rating} size="sm" />
            <span className="text-muted-foreground text-xs">
              {review.relativePublishTimeDescription}
            </span>
          </div>
          <div className="text-muted-foreground flex items-center gap-1 text-[10.5px] font-bold">
            <HugeiconsIcon icon={Location01Icon} className="size-3" />
            {t("Google")}
          </div>
          {review.text && (
            <p className="text-foreground text-[14px] leading-relaxed whitespace-pre-line">
              {review.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function BusinessReviews({
  businessId,
  initialItems,
  initialCursor,
  summary,
  // How many of `summary.count` are Google's, not Qura's own — credits
  // Google's contribution to the combined stat above the list.
  googleCount = 0,
  // The actual Google review CONTENT (text/author/rating/date) for this
  // business's primary connected place, if any — already fully fetched
  // server-side (`profile-tabs.tsx`), never paginated on Google's side
  // (it returns at most 5 per place), so "loading more" of these is
  // really just revealing them, not another network round-trip.
  googleReviews = [],
  myReview,
  canReview,
  viewer,
}: {
  businessId: string;
  initialItems: Review[];
  initialCursor: number | null;
  summary: { average: number | null; count: number };
  googleCount?: number;
  googleReviews?: GooglePlaceReview[];
  myReview: MyReview | null;
  canReview: boolean;
  viewer?: { name: string; image?: string | null } | null;
}) {
  const { t } = useLocale();
  const [editing, setEditing] = useState(false);

  const initialListItems: ReviewListItem[] = initialItems.map((review) => ({
    kind: "qura",
    ...review,
  }));

  // Qura's own reviews come first, in their existing paginated order
  // (`loadMoreBusinessReviewsAction`); Google's reviews only ever appear
  // as one final batch AFTER Qura's are fully exhausted — never
  // interleaved, and never before a single Qura review that exists.
  const { items, isLoading, hasMore, sentinelRef } = useInfiniteList<
    ReviewListItem,
    ReviewsCursor
  >({
    initialItems: initialListItems,
    initialCursor: initialCursor ?? (googleReviews.length > 0 ? "google" : null),
    fetchMore: async (cursor) => {
      if (cursor === "google") {
        return {
          items: googleReviews.map((review, index) => ({
            kind: "google",
            id: `google:${businessId}:${index}`,
            ...review,
          })),
          nextCursor: null,
        };
      }
      const result = await loadMoreBusinessReviewsAction(businessId, cursor);
      return {
        items: result.items.map((review) => ({ kind: "qura", ...review })),
        nextCursor:
          result.nextCursor ??
          (googleReviews.length > 0 ? "google" : null),
      };
    },
  });

  return (
    <div className="flex flex-col">
      {summary.count > 0 && (
        <div className="flex flex-col items-center gap-1 py-3">
          <div className="container flex items-center justify-center gap-2">
            <StarRating value={Math.round(summary.average ?? 0)} />
            <span className="text-foreground text-[13px] font-semibold">
              {summary.average?.toFixed(1)}
            </span>
            <span className="text-muted-foreground text-[12.5px]">
              ({summary.count})
            </span>
          </div>
          {googleCount > 0 && (
            <span className="text-muted-foreground text-[11px]">
              {t("Includes {{count}} Google reviews").replace(
                "{{count}}",
                String(googleCount),
              )}
            </span>
          )}
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
        !editing && (
          <div className="divide-border/50 flex flex-col divide-y">
            {items.map((item) =>
              item.kind === "google" ? (
                <GoogleReviewRow key={item.id} review={item} />
              ) : (
                <ReviewRow
                  key={item.id}
                  review={item}
                  isOwn={myReview?.id === item.id}
                  onEdit={() => setEditing(true)}
                />
              ),
            )}
          </div>
        )
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
