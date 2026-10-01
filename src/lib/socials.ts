// Links a profile shows as icons: phone numbers, WhatsApp, website and
// social media. Stored by `platform` key (never rename one — it's saved
// data). Brand names aren't translated. Client-safe.

import {
  Call02Icon,
  Facebook02Icon,
  Globe02Icon,
  InstagramIcon,
  Linkedin01Icon,
  NewTwitterIcon,
  SnapchatIcon,
  TelegramIcon,
  TiktokIcon,
  WhatsappIcon,
  YoutubeIcon,
  type IconSvgElement,
} from "@/components/icons";

// `colors`: the brand's own colours for a round icon button (background +
// icon). X and TikTok are black-and-white brands, so they follow the theme.
export const SOCIAL_PLATFORMS = {
  // Not a brand: shown as "Website" in the app language.
  website: {
    name: "Website",
    icon: Globe02Icon,
    colors: "bg-muted text-foreground/80",
  },
  // Not a brand: shown as "Call" in the app language. `url` is
  // "tel:" + the number as written ("tel:+20 97 123 4567"); a profile can
  // have several.
  phone: {
    name: "Call",
    icon: Call02Icon,
    colors: "bg-muted text-foreground/80",
  },
  // Required for businesses: always first (see `WhatsappLink`).
  whatsapp: {
    name: "WhatsApp",
    icon: WhatsappIcon,
    colors: "bg-[#25D366] text-white",
  },
  facebook: {
    name: "Facebook",
    icon: Facebook02Icon,
    colors: "bg-[#1877F2] text-white",
  },
  instagram: {
    name: "Instagram",
    icon: InstagramIcon,
    colors:
      "bg-[linear-gradient(45deg,#FEDA75,#FA7E1E_25%,#D62976_50%,#962FBF_75%,#4F5BD5)] text-white",
  },
  tiktok: {
    name: "TikTok",
    icon: TiktokIcon,
    colors: "bg-foreground text-background",
  },
  x: {
    name: "X",
    icon: NewTwitterIcon,
    colors: "bg-foreground text-background",
  },
  youtube: {
    name: "YouTube",
    icon: YoutubeIcon,
    colors: "bg-[#FF0000] text-white",
  },
  snapchat: {
    name: "Snapchat",
    icon: SnapchatIcon,
    colors: "bg-[#FFFC00] text-black",
  },
  telegram: {
    name: "Telegram",
    icon: TelegramIcon,
    colors: "bg-[#26A5E4] text-white",
  },
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin01Icon,
    colors: "bg-[#0A66C2] text-white",
  },
} as const satisfies Record<
  string,
  { name: string; icon: IconSvgElement; colors: string }
>;

type SocialPlatform = keyof typeof SOCIAL_PLATFORMS;

/** One of a profile's accounts: which network, and the full link to it. */
export type SocialLink = { platform: SocialPlatform; url: string };

/** A business's WhatsApp link — required, and first in its `socials`. */
export type WhatsappLink = { platform: "whatsapp"; url: string };

/** The WhatsApp chat link with a message ready to send ("Order on WhatsApp"). */
export function withMessage(whatsapp: WhatsappLink, text: string) {
  const url = new URL(whatsapp.url);
  url.searchParams.set("text", text);
  return url.toString();
}

/** "tel:+20 97 123 4567" → "+20 97 123 4567" (as the owner wrote it). */
const phoneNumber = (link: SocialLink) => link.url.replace(/^tel:/, "");

/**
 * What a link shows next to its icon: "@handle" for social networks, the
 * number for WhatsApp/phone, the domain for a website.
 *   instagram.com/aswan.eats → @aswan.eats · tiktok.com/@x → @x
 *   wa.me/201002345678 → +201002345678 · tel:+20 97 1… → +20 97 1…
 */
export function socialLabel(link: SocialLink) {
  const { platform, url } = link;
  if (platform === "phone") return phoneNumber(link);
  if (platform === "whatsapp") return `+${url.replace(/\D/g, "")}`;
  const { hostname, pathname } = new URL(url);
  if (platform === "website") return hostname.replace(/^www\./, "");
  const handle = pathname.split("/").filter(Boolean)[0] ?? hostname;
  return `@${handle.replace(/^@/, "")}`;
}
