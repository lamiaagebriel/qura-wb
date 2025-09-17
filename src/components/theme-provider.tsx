"use client";

import * as React from "react";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLocale } from "@/components/locale-provider";

// TODO: onchanging the locale, we need to refresh to get the selected theme
export function ThemeProvider({
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props} />;
}

export function ModeSwitcher() {
  const { "mode-switcher": c } = useLocale();
  const { theme, setTheme } = useTheme();

  // Card indicator for light theme
  function LightCard() {
    return (
      <div className="border-muted hover:border-accent w-full items-center rounded-md border-2 bg-[#f8fafc] p-1">
        <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
          <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
            <div className="h-2 w-[60%] rounded-lg bg-[#ecedef]" />
            <div className="h-2 w-[85%] rounded-lg bg-[#ecedef]" />
          </div>
          <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
            <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
            <div className="h-2 w-[85%] rounded-lg bg-[#ecedef]" />
          </div>
          <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
            <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
            <div className="h-2 w-[85%] rounded-lg bg-[#ecedef]" />
          </div>
        </div>
      </div>
    );
  }

  // Card indicator for dark theme
  function DarkCard() {
    return (
      <div className="border-muted hover:border-accent w-full items-center rounded-md border-2 bg-[#0f172a] p-1">
        <div className="space-y-2 rounded-sm bg-slate-950 p-2">
          <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
            <div className="h-2 w-[60%] rounded-lg bg-slate-400" />
            <div className="h-2 w-[85%] rounded-lg bg-slate-400" />
          </div>
          <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
            <div className="h-4 w-4 rounded-full bg-slate-400" />
            <div className="h-2 w-[85%] rounded-lg bg-slate-400" />
          </div>
          <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
            <div className="h-4 w-4 rounded-full bg-slate-400" />
            <div className="h-2 w-[85%] rounded-lg bg-slate-400" />
          </div>
        </div>
      </div>
    );
  }

  // Card indicator for system theme (half light, half dark)
  function SystemCard() {
    return (
      <div className="border-muted hover:border-accent w-full items-center rounded-md border-2 bg-gradient-to-r from-[#f8fafc] to-[#0f172a] p-1">
        <div className="flex overflow-hidden rounded-sm">
          {/* Left: Light */}
          <div className="w-1/2 space-y-2 bg-[#ecedef] p-2">
            <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
              <div className="h-2 w-[60%] rounded-lg bg-[#ecedef]" />
              <div className="h-2 w-[85%] rounded-lg bg-[#ecedef]" />
            </div>
            <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-sm">
              <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
              <div className="h-2 w-[85%] rounded-lg bg-[#ecedef]" />
            </div>
            <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-sm">
              <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
              <div className="h-2 w-[85%] rounded-lg bg-[#ecedef]" />
            </div>
          </div>
          {/* Divider */}
          <div className="w-px bg-gradient-to-b from-[#ecedef] via-gray-400 to-slate-950 opacity-60" />
          {/* Right: Dark */}
          <div className="w-1/2 space-y-2 bg-slate-950 p-2">
            <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
              <div className="h-2 w-[60%] rounded-lg bg-slate-400" />
              <div className="h-2 w-[85%] rounded-lg bg-slate-400" />
            </div>
            <div className="flex items-center gap-2 rounded-md bg-slate-800 p-2 shadow-sm">
              <div className="h-4 w-4 rounded-full bg-slate-400" />
              <div className="h-2 w-[85%] rounded-lg bg-slate-400" />
            </div>
            <div className="flex items-center gap-2 rounded-md bg-slate-800 p-2 shadow-sm">
              <div className="h-4 w-4 rounded-full bg-slate-400" />
              <div className="h-2 w-[85%] rounded-lg bg-slate-400" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Label>{c["theme"]}</Label>
      <p className="text-muted-foreground text-sm">
        {c["automatically switch between day and night themes."]}
      </p>

      <RadioGroup
        onValueChange={(e) => {
          setTheme(e);
        }}
        defaultValue={theme}
        className="grid gap-8 pt-2 sm:grid-cols-4"
      >
        <Label className="[&:has([data-state=checked])>div]:border-primary w-full flex-1 flex-col">
          <RadioGroupItem value="light" className="sr-only" />

          <LightCard />
          <span className="block w-full p-2 text-center font-normal">
            {c["light"]}
          </span>
        </Label>

        <Label className="[&:has([data-state=checked])>div]:border-primary w-full flex-1 flex-col">
          <RadioGroupItem value="dark" className="sr-only" />
          <DarkCard />
          <span className="block w-full p-2 text-center font-normal">
            {c["dark"]}
          </span>
        </Label>

        <Label className="[&:has([data-state=checked])>div]:border-primary w-full flex-1 flex-col sm:col-span-2">
          <RadioGroupItem value="system" className="sr-only" />
          <SystemCard />
          <span className="block w-full p-2 text-center font-normal">
            {c["system"]}
          </span>
        </Label>
      </RadioGroup>
    </div>
  );
}
