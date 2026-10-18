"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createContext,
  use,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { useAuthSheet } from "@/components/auth/auth-sheet";
import {
  ArrowUp01Icon,
  Cancel01Icon,
  HugeiconsIcon,
  StarIcon,
} from "@/components/icons";
import { ConfirmSheet } from "@/components/sheets/confirm-sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/provider";
import {
  REVIEW_MAX_LENGTH,
  reviewSchema,
  type ReviewInput,
} from "@/lib/reviews";
import { cn } from "@/lib/utils";

import { deleteReview, postReview } from "./social-actions";

const STARS = [1, 2, 3, 4, 5] as const;
// The counter shows once a review gets this close to the limit.
const COUNT_FROM = REVIEW_MAX_LENGTH - 200;

/** A short buzz, like a native control (Android; iOS ignores it). */
const buzz = (ms: number | number[] = 8) => navigator.vibrate?.(ms);
const EMPTY: ReviewInput = { rating: 0, text: "" };

// At the bottom, clear of the home indicator (no tab bar on this screen);
// on the keyboard while it's up.
const BAR =
  "fixed inset-x-0 bottom-0 z-30 border-t border-border/50 bg-background/95 pb-(--safe-bottom) backdrop-blur-xs in-data-[keyboard=open]:bottom-(--keyboard-inset) in-data-[keyboard=open]:pb-0";

type Composer = {
  username: string;
  /** Your review, while the bar is editing it. */
  editing: boolean;
  edit: () => void;
  stopEditing: () => void;
};

const ComposerContext = createContext<Composer | null>(null);

const useComposer = () => {
  const composer = use(ComposerContext);
  if (!composer) throw new Error("Inside <ReviewComposer> only");
  return composer;
};

/**
 * The reviews screen, written like comments (Instagram, WhatsApp): the
 * list, then a message bar pinned to the bottom (on the keyboard while
 * typing) — your photo, a 1–5 star row and a rounded field whose send
 * button shows once you've picked a star. One review per person: once
 * written, the bar goes away and your review (first in the list) gets
 * Edit — the bar comes back on it, "Editing your review" with × — and
 * Delete (confirmed). Signed out, the bar opens the sign-in sheet.
 */
export function ReviewComposer({
  username,
  businessName,
  me,
  mine,
  hasVisibleReview,
  children,
}: {
  username: string;
  businessName: string;
  /** The signed-in user (undefined: signed out). */
  me?: { name: string; avatarUrl: string | null };
  /** The review you already wrote, if any. */
  mine?: ReviewInput;
  /** Your review is in the list (not hidden by an admin). */
  hasVisibleReview: boolean;
  children: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const composer: Composer = {
    username,
    editing,
    edit: () => {
      setEditing(true);
      // Focus in the same tap, so iOS brings up the keyboard.
      requestAnimationFrame(() => field.current?.focus());
    },
    stopEditing: () => setEditing(false),
  };
  const showBar = !hasVisibleReview || editing;
  const bar = useRef<HTMLDivElement>(null);
  useBarHeight(bar, showBar);

  return (
    <ComposerContext value={composer}>
      {children}
      {/* Keeps the last review clear of the bar, however tall it grows. */}
      {showBar && <div aria-hidden className="h-[var(--review-bar,calc(6rem+var(--safe-bottom)))] shrink-0" />}
      {showBar && (
        <div ref={bar} className={BAR}>
          <div className="mx-auto max-w-md px-3 py-2">
            {me ? (
              <ReviewForm
                // A fresh form each time editing starts or stops.
                key={editing ? "edit" : "new"}
                me={me}
                businessName={businessName}
                initial={mine ?? EMPTY}
                fieldRef={field}
              />
            ) : (
              <SignedOutBar />
            )}
          </div>
        </div>
      )}
    </ComposerContext>
  );
}

function ReviewForm({
  me,
  businessName,
  initial,
  fieldRef,
}: {
  me: { name: string; avatarUrl: string | null };
  businessName: string;
  initial: ReviewInput;
  fieldRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const { t, locale } = useLocale();
  const { username, editing, stopEditing } = useComposer();
  const form = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: initial,
  });
  const rating = useWatch({ control: form.control, name: "rating" });
  const length = useWatch({ control: form.control, name: "text" }).length;
  const number = new Intl.NumberFormat(locale);

  const post = form.handleSubmit(async (values) => {
    (document.activeElement as HTMLElement | null)?.blur();
    const result = await postReview(username, values);
    if (!result.ok) {
      toast.add({ title: t(result.error), type: "error" });
      return;
    }
    buzz([10, 40, 10]);
    toast.add({
      title: editing ? t("Review updated") : t("Thanks for your review!"),
    });
    stopEditing();
  });

  return (
    <form
      aria-label={editing ? t("Edit your review") : t("Write a review")}
      className="flex flex-col gap-1"
      onSubmit={post}
      data-keep-keyboard
    >
      {/* The star row, where Instagram has its quick emoji. */}
      <Controller
        control={form.control}
        name="rating"
        render={({ field }) => (
          <div
            role="radiogroup"
            aria-label={t("Your rating")}
            className="flex items-center justify-between"
          >
            <div className="flex items-center">
              {STARS.map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={field.value === star}
                  aria-label={t("{{rating}} out of 5 stars", {
                    rating: number.format(star),
                  })}
                  onClick={() => {
                    buzz();
                    field.onChange(star);
                  }}
                  // Looks 36px; the ::before keeps the tap area at 44px.
                  className="relative flex size-9 items-center justify-center rounded-full before:absolute before:-inset-1 before:content-['']"
                >
                  <HugeiconsIcon
                    icon={StarIcon}
                    strokeWidth={1.5}
                    className={cn(
                      "size-6 transition-[color,scale] active:scale-90",
                      star <= field.value
                        ? "fill-current text-amber-500"
                        : "text-muted-foreground/40",
                    )}
                  />
                </button>
              ))}
            </div>
            <span
              dir="auto"
              className="min-w-0 truncate pe-1 text-xs text-muted-foreground"
            >
              {businessName}
            </span>
          </div>
        )}
      />

      <div className="flex items-end gap-2">
        <Avatar className="mb-0.5 size-9 shrink-0">
          <AvatarImage src={me.avatarUrl ?? undefined} alt="" />
          <AvatarFallback>{me.name}</AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl bg-muted ring-1 ring-foreground/5">
          {editing && (
            <div className="flex items-center justify-between border-b border-border/60 ps-4">
              <span className="text-xs text-muted-foreground">
                {t("Editing your review")}
              </span>
              <button
                type="button"
                aria-label={t("Cancel")}
                onClick={stopEditing}
                className="flex size-11 items-center justify-center text-muted-foreground"
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={2}
                  className="size-4"
                />
              </button>
            </div>
          )}
          {length >= COUNT_FROM && (
            <span
              aria-live="polite"
              className={cn(
                "px-3.5 pt-1.5 text-end text-[0.6875rem] text-muted-foreground tabular-nums",
                length >= REVIEW_MAX_LENGTH && "text-destructive",
              )}
            >
              {t("{{count}} / {{max}}", {
                count: number.format(length),
                max: number.format(REVIEW_MAX_LENGTH),
              })}
            </span>
          )}
          <div className="flex items-end">
            <Controller
              control={form.control}
              name="text"
              render={({ field }) => (
                <textarea
                  {...field}
                  ref={(el) => {
                    field.ref(el);
                    fieldRef.current = el;
                  }}
                  placeholder={t("What do you think of this place?")}
                  aria-label={t("Your review")}
                  dir="auto"
                  rows={1}
                  maxLength={REVIEW_MAX_LENGTH}
                  enterKeyHint="send"
                  autoComplete="off"
                  className="field-sizing-content max-h-24 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-3.5 py-2 leading-6 outline-none placeholder:text-muted-foreground"
                />
              )}
            />
            {/* Like Instagram: the send button shows once there's a star. */}
            {rating > 0 && (
              <Button
                type="submit"
                size="icon"
                aria-label={t("Post review")}
                className="m-1 size-8 shrink-0 rounded-full"
                disabled={form.formState.isSubmitting}
              >
                <HugeiconsIcon
                  icon={ArrowUp01Icon}
                  strokeWidth={2.5}
                  className="size-4"
                />
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

function SignedOutBar() {
  const { t } = useLocale();
  const { open: signIn } = useAuthSheet();
  return (
    <button
      type="button"
      onClick={() => signIn()}
      className="flex h-11 w-full items-center gap-2 rounded-3xl bg-muted px-4 text-start text-muted-foreground ring-1 ring-foreground/5"
    >
      <HugeiconsIcon icon={StarIcon} strokeWidth={2} className="size-5" />
      {t("Write a review")}
    </button>
  );
}

/** Your review in the list: highlighted while the bar edits it. */
export function MyReviewRow({ children }: { children: ReactNode }) {
  const { editing } = useComposer();
  return (
    <div
      className={cn(
        "-mx-4 px-4 transition-colors",
        editing && "bg-muted",
      )}
    >
      {children}
    </div>
  );
}

/** "Edit · Delete" under your review, where Instagram has its links. */
export function MyReviewActions() {
  const { t } = useLocale();
  const { username, edit, stopEditing } = useComposer();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <div className="-ms-2 flex items-center">
        <button
          type="button"
          onClick={edit}
          className="h-11 px-2 text-xs font-semibold text-muted-foreground"
        >
          {t("Edit")}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="h-11 px-2 text-xs font-semibold text-muted-foreground"
        >
          {t("Delete")}
        </button>
      </div>
      <ConfirmSheet
        open={confirming}
        onOpenChange={setConfirming}
        title={t("Delete your review?")}
        description={t("Your stars and text will be removed.")}
        confirmLabel={t("Delete")}
        destructive
        onConfirm={async () => {
          const result = await deleteReview(username);
          if (!result.ok) {
            toast.add({ title: t(result.error), type: "error" });
            return;
          }
          stopEditing();
          toast.add({ title: t("Review deleted") });
        }}
      />
    </>
  );
}

/**
 * Publishes the bar's real height (it grows with the text and the
 * "Editing" row) as `--review-bar`, for the spacer under the list, and
 * lifts toasts above it (`--toast-bottom`, read by the toast viewport).
 */
function useBarHeight(bar: React.RefObject<HTMLDivElement | null>, shown: boolean) {
  useEffect(() => {
    const el = bar.current;
    if (!shown || !el) return;
    const root = document.documentElement.style;
    const observer = new ResizeObserver(() => {
      const height = el.offsetHeight;
      root.setProperty("--review-bar", `${height}px`);
      root.setProperty("--toast-bottom", `calc(${height + 12}px + var(--keyboard-inset, 0px))`);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.removeProperty("--review-bar");
      root.removeProperty("--toast-bottom");
    };
  }, [bar, shown]);
}
