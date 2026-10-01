"use client";

import { HugeiconsIcon, Link01Icon } from "@/components/icons";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLocale } from "@/lib/i18n/provider";
import { SOCIAL_PLATFORMS, socialLabel, type SocialLink } from "@/lib/socials";
import { cn } from "@/lib/utils";

import { DETAILS_ITEM, DETAILS_TRIGGER } from "./details-item";

/** How many brand icons the closed row previews. */
const PREVIEW = 5;

/**
 * A business's links, shown like its working hours: a row with "Contact
 * and links" and a peek of the icons; tapping it slides the full list open
 * (shadcn Accordion). Every entry is its own link: WhatsApp and phone
 * numbers, the website, "@handle" for each social account.
 */
export function LinksItem({ socials }: { socials: SocialLink[] }) {
  const { t } = useLocale();
  // One preview icon per platform (several phone numbers → one phone).
  const preview = [...new Set(socials.map((s) => s.platform))].slice(
    0,
    PREVIEW,
  );

  return (
    <AccordionItem value="links" className={DETAILS_ITEM}>
      <AccordionTrigger className={DETAILS_TRIGGER}>
        <HugeiconsIcon
          icon={Link01Icon}
          strokeWidth={2}
          className="size-5 shrink-0 text-muted-foreground"
        />
        <span className="min-w-0 flex-1 truncate font-medium">
          {t("Contact and links")}
        </span>
        <span
          aria-hidden
          className="flex shrink-0 -space-x-1.5 rtl:space-x-reverse"
        >
          {preview.map((platform) => {
            const { icon, colors } = SOCIAL_PLATFORMS[platform];
            return (
              <span
                key={platform}
                className={cn(
                  "flex size-6 items-center justify-center rounded-full ring-2 ring-card",
                  colors,
                )}
              >
                <HugeiconsIcon
                  icon={icon}
                  strokeWidth={2}
                  className="size-3.5"
                />
              </span>
            );
          })}
        </span>
      </AccordionTrigger>
      {/* The panel adds px-2; -mx-2 gives the rows the card's full width. */}
      <AccordionContent className="-mx-2 pb-1">
        <ul>
          {socials.map((link) => {
            const { name, icon, colors } = SOCIAL_PLATFORMS[link.platform];
            const label = socialLabel(link);
            // "Call" / "Website" are ours; brand names stay as they are.
            const what =
              link.platform === "phone"
                ? t("Call")
                : link.platform === "website"
                  ? t("Website")
                  : name;
            return (
              <li key={link.url}>
                <a
                  href={link.url}
                  {...(link.platform !== "phone" && {
                    target: "_blank",
                    rel: "noopener noreferrer",
                  })}
                  aria-label={`${what}: ${label}`}
                  className="flex min-h-11 items-center gap-3 px-4 py-1.5 text-sm"
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full",
                      colors,
                    )}
                  >
                    <HugeiconsIcon
                      icon={icon}
                      strokeWidth={2}
                      className="size-4"
                    />
                  </span>
                  <bdi dir="ltr" className="min-w-0 truncate font-medium">
                    {label}
                  </bdi>
                </a>
              </li>
            );
          })}
        </ul>
      </AccordionContent>
    </AccordionItem>
  );
}
