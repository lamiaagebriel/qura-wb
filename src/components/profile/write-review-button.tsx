"use client";

import { EditDeleteGroup } from "@/components/edit-delete-group";
import { createContext, use, useRef, useState, type ReactNode } from "react";

import { ComposerBar, SignedOutBar } from "@/components/composer-bar";
import { StarIcon } from "@/components/icons";
import { ReviewForm } from "@/components/forms/review-form";
import { useAction } from "@/hooks/use-action";
import { useLocale } from "@/lib/i18n/provider";
import type { ReviewFormValues as ReviewInput } from "@/lib/validations/review-form";
import { cn } from "@/lib/utils";

import { deleteReview } from "@/server/actions/social";

const EMPTY: ReviewInput = { rating: 0, text: "" };

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
  const { t } = useLocale();
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

  return (
    <ComposerContext value={composer}>
      {children}
      {showBar && (
        <ComposerBar>
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
            <SignedOutBar icon={StarIcon} label={t("Write a review")} />
          )}
        </ComposerBar>
      )}
    </ComposerContext>
  );
}

/** Your review in the list: highlighted while the bar edits it. */
export function MyReviewRow({ children }: { children: ReactNode }) {
  const { editing } = useComposer();
  return (
    <div className={cn("-mx-4 px-4 transition-colors", editing && "bg-muted")}>
      {children}
    </div>
  );
}

/** "Edit · Delete" under your review, where Instagram has its links. */
export function MyReviewActions() {
  const { run } = useAction();
  const { username, edit, stopEditing } = useComposer();
  return (
    <EditDeleteGroup
      onEdit={edit}
      onDelete={() =>
        run(() => deleteReview(username), {
          success: "Review deleted",
          onDone: stopEditing,
        })
      }
    />
  );
}
