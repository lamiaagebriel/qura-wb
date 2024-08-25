"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Dictionary } from "@/types/locale";

export type ResponsiveDialogProps = {
  trigger: React.ReactNode;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  confirm: React.ReactNode;

  disabled?: boolean;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  children?: React.ReactNode;
} & Dictionary["responsive-dialog"];

export function ResponsiveDialog({
  dic: { "responsive-dialog": c },
  trigger,
  confirm,
  open,
  setOpen,

  disabled,
  title,
  description,
  children,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
        <AlertDialogContent className="max-h-[95vh] overflow-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="justify-start">
              {title ?? c?.["are you sure you want to proceed?"]}
            </AlertDialogTitle>
            <AlertDialogDescription className="max-w-prose">
              {description ??
                c?.[
                  "please confirm that all the provided information is accurate. This action cannot be undone."
                ]}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {children}

          <AlertDialogFooter className="gap-2">
            {confirm}
            <AlertDialogCancel disabled={disabled}>
              {c?.["cancel"]}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="max-h-[95vh]">
        <div className="overflow-auto">
          <DrawerHeader>
            <DrawerTitle>
              {title ?? c?.["are you sure you want to proceed?"]}
            </DrawerTitle>
            <DrawerDescription className="max-w-prose">
              {description ??
                c?.[
                  "please confirm that all the provided information is accurate. This action cannot be undone."
                ]}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">{children}</div>

          <DrawerFooter className="gap-2">
            {confirm}
            <DrawerClose disabled={disabled} asChild>
              <Button disabled={disabled} variant="outline">
                {c?.["cancel"]}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
