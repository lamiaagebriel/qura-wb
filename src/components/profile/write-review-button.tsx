"use client";

import {
  createContext,
  use,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuthSheet } from "@/components/auth/auth-sheet";
import { HugeiconsIcon, StarIcon } from "@/components/icons";
import { ConfirmSheet } from "@/components/sheets/confirm-sheet";
import { toast } from "@/components/ui/toast";
import { ReviewForm } from "@/components/forms/review-form";
import { useLocale } from "@/lib/i18n/provider";
import type {
  ReviewFormValues as ReviewInput,
} from "@/lib/validations/review-form";
import { cn } from "@/lib/utils";

import { deleteReview } from "@/server/actions/social";

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
  /** Your review is in the list (not hidden). */
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
                username={username}
                editing={editing}
                me={me}
                businessName={businessName}
                initial={mine ?? EMPTY}
                fieldRef={field}
                onDone={() => setEditing(false)}
                onCancel={() => setEditing(false)}
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
