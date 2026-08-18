import * as z from "zod";
import {
  FacebookIcon,
  GlobalIcon,
  InstagramIcon,
  LinkedinIcon,
  NewTwitterIcon,
  PinterestIcon,
  SnapchatIcon,
  TelegramIcon,
  TiktokIcon,
  WhatsappIcon,
  YoutubeIcon,
} from "@hugeicons/core-free-icons";

import type { Dict } from "@/lib/i18n/config";

type Translate = (key: keyof Dict) => string;
type IconType = typeof GlobalIcon;

const URL_RE = /^https?:\/\/.+/i;

export function createSocialLinksSchema(t: Translate) {
  return z
    .array(z.string().regex(URL_RE, t("Enter a valid URL.")))
    .max(6, t("Up to 6 social links."));
}

// Matched by hostname, most-specific-looking domains first isn't
// actually necessary here — every domain below is already unique to one
// platform. `GlobalIcon` (a plain globe) is the fallback for a personal
// site or anything not in this list, not an error state.
const PLATFORM_HOSTS: { test: RegExp; icon: IconType; label: keyof Dict }[] = [
  { test: /(^|\.)instagram\.com$/, icon: InstagramIcon, label: "Instagram" },
  { test: /(^|\.)(x|twitter)\.com$/, icon: NewTwitterIcon, label: "X" },
  { test: /(^|\.)facebook\.com$/, icon: FacebookIcon, label: "Facebook" },
  { test: /(^|\.)tiktok\.com$/, icon: TiktokIcon, label: "TikTok" },
  { test: /(^|\.)youtube\.com$/, icon: YoutubeIcon, label: "YouTube" },
  { test: /(^|\.)linkedin\.com$/, icon: LinkedinIcon, label: "LinkedIn" },
  { test: /(^|\.)snapchat\.com$/, icon: SnapchatIcon, label: "Snapchat" },
  { test: /(^|\.)pinterest\.[a-z.]+$/, icon: PinterestIcon, label: "Pinterest" },
  { test: /(^|\.)t\.me$/, icon: TelegramIcon, label: "Telegram" },
  { test: /(^|\.)(wa\.me|whatsapp\.com)$/, icon: WhatsappIcon, label: "WhatsApp" },
];

export function detectSocialPlatform(
  url: string,
): { icon: IconType; label: keyof Dict } {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const match = PLATFORM_HOSTS.find((p) => p.test.test(hostname));
    if (match) return { icon: match.icon, label: match.label };
  } catch {
    // Not a parseable URL (e.g. still being typed) — falls through to
    // the same generic-website icon as an unrecognized domain.
  }
  return { icon: GlobalIcon, label: "Website" };
}
