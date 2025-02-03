"use client";

import { useTheme } from "next-themes";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLocale } from "@/components/locale-provider";

export type SettingsAppearanceFormProps = {};
export function SettingsAppearanceForm({}: SettingsAppearanceFormProps) {
  const { "settings-appearance-form": c } = useLocale();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-1">
      <Label>{c["theme"]}</Label>
      <p className="text-sm text-muted-foreground">
        {c["automatically switch between day and night themes."]}
      </p>

      <RadioGroup
        onValueChange={(e) => {
          setTheme(e);
        }}
        defaultValue={theme}
        className="grid gap-8 pt-2 sm:grid-cols-3"
      >
        <div>
          <Label className="[&:has([data-state=checked])>div]:border-primary">
            <div>
              <RadioGroupItem value="light" className="sr-only" />
            </div>
            <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
              <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                  <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                  <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                  <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                  <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                  <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                  <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                </div>
              </div>
            </div>
            <span className="block w-full p-2 text-center font-normal">
              {c["light"]}
            </span>
          </Label>
        </div>
        <div>
          <Label className="[&:has([data-state=checked])>div]:border-primary">
            <div>
              <RadioGroupItem value="dark" className="sr-only" />
            </div>
            <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                  <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                  <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                  <div className="h-4 w-4 rounded-full bg-slate-400" />
                  <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                  <div className="h-4 w-4 rounded-full bg-slate-400" />
                  <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                </div>
              </div>
            </div>
            <span className="block w-full p-2 text-center font-normal">
              {c["dark"]}
            </span>
          </Label>
        </div>

        <div>
          <Label className="[&:has([data-state=checked])>div]:border-primary">
            <div>
              <RadioGroupItem value="system" className="sr-only" />
            </div>
            <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                  <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                  <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                  <div className="h-4 w-4 rounded-full bg-slate-400" />
                  <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                  <div className="h-4 w-4 rounded-full bg-slate-400" />
                  <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                </div>
              </div>
            </div>
            <span className="block w-full p-2 text-center font-normal">
              {c["system"]}
            </span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
