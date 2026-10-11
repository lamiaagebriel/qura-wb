// How each post type looks: label (picker, badges), plural (home, page titles), icon and tint — the
// home sections, the type pages, the card badge and the composer's picker.
// Client-safe.

import {
  Alert02Icon,
  Briefcase01Icon,
  Calendar03Icon,
  DiscountTag01Icon,
  House03Icon,
  Megaphone01Icon,
  Message01Icon,
  QuestionIcon,
  SearchAreaIcon,
  SparklesIcon,
  UserGroupIcon,
  type IconSvgElement,
} from "@/components/icons";
import type { MessageKey } from "@/lib/i18n/types";
import type { PostType } from "@/lib/posts";

// Full class strings, so Tailwind sees them.
export const POST_TYPE_META: Record<
  PostType,
  {
    label: MessageKey;
    /** Home chips, section and page titles. */
    plural: MessageKey;
    icon: IconSvgElement;
    /** Soft background + text in the type's color (badges, tiles). */
    tint: string;
  }
> = {
  general: {
    label: "General",
    plural: "General",
    icon: Message01Icon,
    tint: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },
  question: {
    label: "Question",
    plural: "Questions",
    icon: QuestionIcon,
    tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  together: {
    label: "Together",
    plural: "Do it together",
    icon: UserGroupIcon,
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  experience: {
    label: "Experience",
    plural: "Experiences",
    icon: SparklesIcon,
    tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  event: {
    label: "Event",
    plural: "Events",
    icon: Calendar03Icon,
    tint: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  offer: {
    label: "Offer",
    plural: "Offers",
    icon: DiscountTag01Icon,
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  announcement: {
    label: "Announcement",
    plural: "Announcements",
    icon: Megaphone01Icon,
    tint: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },
  job: {
    label: "Job",
    plural: "Jobs",
    icon: Briefcase01Icon,
    tint: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  housing: {
    label: "Housing",
    plural: "Housing",
    icon: House03Icon,
    tint: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  lost_found: {
    label: "Lost & found",
    plural: "Lost & found",
    icon: SearchAreaIcon,
    tint: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  alert: {
    label: "Alert",
    plural: "Alerts",
    icon: Alert02Icon,
    tint: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
};
