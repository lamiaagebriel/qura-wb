"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-h-[95vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {title ?? c?.["are you sure you want to proceed?"]}
            </DialogTitle>
            <DialogDescription className="max-w-prose">
              {description ??
                c?.[
                  "please confirm that all the provided information is accurate. This action cannot be undone."
                ]}
            </DialogDescription>
          </DialogHeader>
          {children}

          <DialogFooter className="gap-2">
            {confirm}
            <DialogClose disabled={disabled} asChild>
              <Button disabled={disabled} variant="outline">
                {c?.["cancel"]}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
