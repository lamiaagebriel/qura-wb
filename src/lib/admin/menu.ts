// The dashboard's sections, grouped as the sidebar shows them: the inbox
// screens, then one entry per table (`/admin/<key>`). A table added to the
// registry (`registry.ts`) gets its entry here. Client-safe.

import {
  Bookmark01Icon,
  ComputerIcon,
  DashboardSquare02Icon,
  Flag01Icon,
  GoogleIcon,
  InboxIcon,
  Key01Icon,
  MapsLocation01Icon,
  Message01Icon,
  PinIcon,
  Shield01Icon,
  StarIcon,
  Store01Icon,
  Tag01Icon,
  Task01Icon,
  ThumbsUpIcon,
  Timer01Icon,
  UserCheck01Icon,
  UserMultiple02Icon,
  type IconSvgElement,
} from "@/components/icons";
import type { MessageKey } from "@/lib/i18n/types";

export type MenuItem = {
  /** A table's key, or the route of a fixed screen. */
  key: string;
  label: MessageKey;
  icon: IconSvgElement;
  /** A fixed screen (overview, inbox) instead of a table. */
  path?: string;
  /** Tinted icon, so sections are easy to tell apart. */
  tint: string;
};

export type MenuGroup = { label: MessageKey; items: MenuItem[] };

const tint = {
  violet: "text-violet-600 dark:text-violet-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
  sky: "text-sky-600 dark:text-sky-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  rose: "text-rose-600 dark:text-rose-400",
  slate: "text-slate-500 dark:text-slate-400",
};

export const MENU: MenuGroup[] = [
  {
    label: "Inbox",
    items: [
      { key: "overview", label: "Overview", icon: DashboardSquare02Icon, path: "/admin", tint: tint.violet },
      { key: "inbox-requests", label: "Requests", icon: InboxIcon, path: "/admin/requests", tint: tint.amber },
      { key: "inbox-reports", label: "Reports", icon: Flag01Icon, path: "/admin/reports", tint: tint.red },
    ],
  },
  {
    label: "People",
    items: [
      { key: "users", label: "Users", icon: UserMultiple02Icon, tint: tint.sky },
      { key: "place-admins", label: "Place admins", icon: Shield01Icon, tint: tint.sky },
      { key: "follows", label: "Follows", icon: UserCheck01Icon, tint: tint.sky },
    ],
  },
  {
    label: "Businesses",
    items: [
      { key: "businesses", label: "Businesses", icon: Store01Icon, tint: tint.emerald },
      { key: "branches", label: "Branches", icon: MapsLocation01Icon, tint: tint.emerald },
      { key: "reviews", label: "Reviews", icon: StarIcon, tint: tint.emerald },
    ],
  },
  {
    label: "Content",
    items: [
      { key: "posts", label: "Posts", icon: Message01Icon, tint: tint.rose },
      { key: "votes", label: "Votes", icon: ThumbsUpIcon, tint: tint.rose },
      { key: "saves", label: "Saves", icon: Bookmark01Icon, tint: tint.rose },
    ],
  },
  {
    label: "Places",
    items: [
      { key: "places", label: "Places", icon: PinIcon, tint: tint.violet },
      { key: "place-types", label: "Kinds of place", icon: Tag01Icon, tint: tint.violet },
    ],
  },
  {
    label: "System",
    items: [
      { key: "tickets", label: "All tickets", icon: InboxIcon, tint: tint.amber },
      { key: "history", label: "History", icon: Task01Icon, tint: tint.slate },
      { key: "sessions", label: "Sessions", icon: ComputerIcon, tint: tint.slate },
      { key: "accounts", label: "Sign-in accounts", icon: GoogleIcon, tint: tint.slate },
      { key: "verifications", label: "Verifications", icon: Key01Icon, tint: tint.slate },
      { key: "rate-limits", label: "Rate limits", icon: Timer01Icon, tint: tint.slate },
    ],
  },
];

/** A table's menu entry (its title and icon). */
export const menuItem = (key: string) =>
  MENU.flatMap((group) => group.items).find((item) => item.key === key && !item.path);

