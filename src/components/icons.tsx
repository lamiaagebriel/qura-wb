// Every icon in the app comes from here — never import "@hugeicons/*" directly.
// Usage: <HugeiconsIcon icon={TranslateIcon} strokeWidth={2} className="size-4" />
// Arrows that point along the reading direction need `rtl:rotate-180`.

export { HugeiconsIcon } from "@hugeicons/react";
export type { IconSvgElement } from "@hugeicons/react";

export {
  // Arrows & chevrons
  ArrowDown01Icon,
  ArrowDown02Icon,
  ArrowDownIcon,
  ArrowLeft01Icon,
  ArrowLeftIcon,
  ArrowRight01Icon,
  ArrowRightIcon,
  ArrowUp01Icon,
  UnfoldMoreIcon,
  // Actions
  Cancel01Icon,
  MinusSignIcon,
  MoreHorizontalCircle01Icon,
  SearchIcon,
  Tick02Icon,
  // Status & feedback
  Alert02Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Loading03Icon,
  MultiplicationSignCircleIcon,
  // Layout
  SidebarLeftIcon,
  // Navigation
  Search01Icon,
  UserCircleIcon,
  // Status screens
  FileNotFoundIcon,
  RefreshIcon,
  Home01Icon,
  // Offline
  WifiDisconnected01Icon,
  // Search
  Clock01Icon,
  // Profile
  Call02Icon,
  CheckmarkBadge01Icon,
  Globe02Icon,
  Link01Icon,
  MapsLocation01Icon,
  PencilEdit02Icon,
  PlusSignIcon,
  Delete02Icon,
  UserCheck01Icon,
  Copy01Icon,
  Gps01Icon,
  Building03Icon,
  Restaurant01Icon,
  UserAdd01Icon,
  StarIcon,
  // Social media (lib/socials.ts)
  Facebook02Icon,
  InstagramIcon,
  Linkedin01Icon,
  NewTwitterIcon,
  SnapchatIcon,
  TelegramIcon,
  TiktokIcon,
  WhatsappIcon,
  YoutubeIcon,
  // Business categories (lib/categories.ts)
  Airplane01Icon,
  Car01Icon,
  Coffee01Icon,
  Dumbbell01Icon,
  Hotel01Icon,
  Medicine02Icon,
  Mortarboard01Icon,
  Scissor01Icon,
  Shirt01Icon,
  ShoppingBasket01Icon,
  Stethoscope02Icon,
  Store01Icon,
  Ticket01Icon,
  Wrench01Icon,
  // Share & install
  Share08Icon,
  SquareArrowUp02Icon,
  AddSquareIcon,
  Download04Icon,
  // Auth
  GoogleIcon,
  Logout03Icon,
  AlertCircleIcon,
  // Locale & theme
  TranslateIcon,
  Sun03Icon,
  Moon02Icon,
  ComputerIcon,
  // Posts (lib/posts.ts)
  Message01Icon,
  UserGroupIcon,
  SparklesIcon,
  QuestionIcon,
  DiscountTag01Icon,
  Megaphone01Icon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  Bookmark01Icon,
  FilterHorizontalIcon,
  BubbleChatIcon,
  Calendar03Icon,
  SearchAreaIcon,
  House03Icon,
  Briefcase01Icon,
  // Business status & admin
  Shield01Icon,
  DashboardSquare02Icon,
  InboxIcon,
  UserMultiple02Icon,
  MoreVerticalIcon,
  // Dashboard tables
  Tag01Icon,
  Task01Icon,
  Key01Icon,
  Timer01Icon,
  ArrowUpDownIcon,
  ArrowLeftDoubleIcon,
  ArrowRightDoubleIcon,
  ViewIcon,
  LinkSquare02Icon,
  LockIcon,
  Settings02Icon,
  Activity01Icon,
  Comment01Icon,
  Flag01Icon,
  StoreRemove01Icon,
} from "@hugeicons/core-free-icons";

// The app's location pin (addresses, cities, map pins) — change it here.
export { Location01Icon as PinIcon } from "@hugeicons/core-free-icons";

/**
 * Google's own "G" in its four colors — for "Continue with Google" (its
 * brand guidelines ask for the colored mark). Not a Hugeicons icon: brand
 * logos keep their colors. Decorative: the button's text names it.
 */
export function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
