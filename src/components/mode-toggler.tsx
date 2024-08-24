"use client";

import { useTheme } from "next-themes";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dictionary } from "@/types/locale";

export type ModeTogglerProps = {} & Dictionary["mode-toggle"];

export function ModeToggler({ dic: { "mode-toggle": c } }: ModeTogglerProps) {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="link"
          size="icon"
          className="h-8 w-8 rounded-full px-0"
        >
          <Icons.sun className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Icons.moon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />

          <span className="sr-only">{c?.["toggle theme"]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {c?.["modes"]?.map((item, i) => {
          const Icon = item?.["icon"]
            ? Icons[item?.["icon"] as keyof typeof Icons]
            : null;

          return (
            <DropdownMenuItem
              key={i}
              className="gap-2"
              onClick={() => {
                if (item?.["value"] === "light") setTheme("light");
                if (item?.["value"] === "dark") setTheme("dark");
                if (item?.["value"] === "system") setTheme("system");
              }}
            >
              {Icon && <Icon />}
              <span>{item?.["label"]}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
