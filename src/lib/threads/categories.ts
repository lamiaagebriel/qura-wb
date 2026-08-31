import type { Clock01Icon } from "@hugeicons/core-free-icons";
import {
  Alert02Icon,
  DiscountTag01Icon,
  Megaphone01Icon,
  Message01Icon,
  QuestionIcon,
  SparklesIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

import type { ThreadCategory } from "@/db/schema";
import type { Dict } from "@/lib/i18n/config";

// Full class strings, never built from a template — Tailwind's scanner
// only picks up class names it can see literally in source, so a
// `text-${color}-600` built at runtime would silently produce no CSS at
// all. `text`/`icon` colors the small chip `ThreadCard` shows above a
// top-level post's body; `chipActive` is the solid-fill look the
// selected filter chip in `FeedThreadList` gets, `chipInactive` the
// tinted-outline look the rest of them get.
type CategoryColor = {
  text: string;
  chipActive: string;
  chipInactive: string;
};

const COLOR: Record<ThreadCategory, CategoryColor> = {
  general: {
    text: "text-slate-600 dark:text-slate-400",
    chipActive: "border-slate-600 bg-slate-600 text-white dark:border-slate-500 dark:bg-slate-500",
    chipInactive: "border-slate-200 text-slate-600 dark:border-slate-500/30 dark:text-slate-400",
  },
  together: {
    text: "text-violet-600 dark:text-violet-400",
    chipActive: "border-violet-600 bg-violet-600 text-white dark:border-violet-500 dark:bg-violet-500",
    chipInactive: "border-violet-200 text-violet-600 dark:border-violet-500/30 dark:text-violet-400",
  },
  experience: {
    text: "text-amber-600 dark:text-amber-400",
    chipActive: "border-amber-600 bg-amber-600 text-white dark:border-amber-500 dark:bg-amber-500",
    chipInactive: "border-amber-200 text-amber-600 dark:border-amber-500/30 dark:text-amber-400",
  },
  question: {
    text: "text-sky-600 dark:text-sky-400",
    chipActive: "border-sky-600 bg-sky-600 text-white dark:border-sky-500 dark:bg-sky-500",
    chipInactive: "border-sky-200 text-sky-600 dark:border-sky-500/30 dark:text-sky-400",
  },
  offer: {
    text: "text-emerald-600 dark:text-emerald-400",
    chipActive: "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500",
    chipInactive: "border-emerald-200 text-emerald-600 dark:border-emerald-500/30 dark:text-emerald-400",
  },
  announcement: {
    text: "text-pink-600 dark:text-pink-400",
    chipActive: "border-pink-600 bg-pink-600 text-white dark:border-pink-500 dark:bg-pink-500",
    chipInactive: "border-pink-200 text-pink-600 dark:border-pink-500/30 dark:text-pink-400",
  },
  alert: {
    text: "text-red-600 dark:text-red-400",
    chipActive: "border-red-600 bg-red-600 text-white dark:border-red-500 dark:bg-red-500",
    chipInactive: "border-red-200 text-red-600 dark:border-red-500/30 dark:text-red-400",
  },
};

/** Icon + label + color for each `ThreadCategory` — the compose picker,
 * the small chip `ThreadCard` shows above a top-level post's body, and
 * `FeedThreadList`'s filter chips all read off this one map, same shape
 * as `CATEGORY_META` for businesses (`lib/categories.ts`), just without
 * the subcategory tree since a post's category is a flat, single
 * choice. */
export const THREAD_CATEGORY_META: Record<
  ThreadCategory,
  { label: keyof Dict; icon: typeof Clock01Icon; color: CategoryColor }
> = {
  general: { label: "General", icon: Message01Icon, color: COLOR.general },
  together: {
    label: "Something to do together",
    icon: UserGroupIcon,
    color: COLOR.together,
  },
  experience: {
    label: "My experience",
    icon: SparklesIcon,
    color: COLOR.experience,
  },
  question: { label: "Question", icon: QuestionIcon, color: COLOR.question },
  offer: { label: "Offer", icon: DiscountTag01Icon, color: COLOR.offer },
  announcement: {
    label: "Announcement",
    icon: Megaphone01Icon,
    color: COLOR.announcement,
  },
  alert: { label: "Alert", icon: Alert02Icon, color: COLOR.alert },
};

// The order shown in the compose picker and the feed's filter chips —
// "general" first as the default/catch-all, then roughly most-to-least
// common on a neighborhood feed.
export const THREAD_CATEGORY_ORDER: ThreadCategory[] = [
  "general",
  "together",
  "experience",
  "question",
  "offer",
  "announcement",
  "alert",
];
