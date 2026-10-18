"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ArrowLeft01Icon, HugeiconsIcon } from "@/components/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { tableHref } from "@/lib/admin/links";
import { MENU } from "@/lib/admin/menu";
import { BRAND } from "@/lib/brand";
import { useLocale } from "@/lib/i18n/provider";
import { href } from "@/lib/routes";
import { cn } from "@/lib/utils";

/**
 * The dashboard's navigation, grouped (inbox, people, businesses…): a
 * sidebar on desktop (collapses to icons), a sheet on phones. `badges`:
 * what waits on a screen, by menu key.
 */
export function AdminSidebar({ badges }: { badges: Record<string, number> }) {
  const { t, dir } = useLocale();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  // On a phone the sidebar is a sheet: close it once a section is picked.
  const close = () => isMobile && setOpenMobile(false);

  return (
    <Sidebar collapsible="icon" side={dir === "rtl" ? "right" : "left"}>
      <SidebarHeader className="pt-[max(--spacing(2),var(--safe-top))]">
        <div className="flex h-11 items-center gap-2 px-2 group-data-[collapsible=icon]:hidden">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            {BRAND.name.slice(0, 1)}
          </span>
          <span className="font-bold">{BRAND.name}</span>
          <span className="rounded-md bg-violet-500/15 px-1.5 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-400">
            {t("Admin")}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {MENU.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{t(group.label)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const path = item.path ?? tableHref(item.key);
                  const active =
                    path === "/admin" ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
                  const badge = badges[item.key] ?? 0;
                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={t(item.label)}
                        render={<Link href={path} onClick={close} />}
                      >
                        <HugeiconsIcon icon={item.icon} strokeWidth={2} className={cn(item.tint)} />
                        <span>{t(item.label)}</span>
                      </SidebarMenuButton>
                      {badge > 0 && (
                        <SidebarMenuBadge className="rounded-full bg-red-500/15 text-red-700 dark:text-red-400">
                          {badge}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="pb-[max(--spacing(2),var(--safe-bottom))]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t("Back to the app")} render={<Link href={href("profile")} />}>
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="rtl:rotate-180" />
              <span>{t("Back to the app")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
