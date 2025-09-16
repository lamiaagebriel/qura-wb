import type { UseFormReturn } from "react-hook-form";

import { Icons } from "@/components/ui/icons";

export type SelectItem = {
  value: string;
  children: string | React.ReactNode;
  disabled?: boolean;
  icon?: keyof typeof Icons;
  // color?: string;
};
export type NavItem = SelectItem & {
  segments: (string | null)[];
};

export type HandleServerActionOnSubmit<R> =
  | Promise<ServerActionResult<R>>
  | (() => Promise<ServerActionResult<R>>);

export type HandleServerActionOptions<R> = {
  form?: UseFormReturn<any>;
  onSuccess?: (data: ServerActionSuccess<R>) => void;
  onError?: (data: ServerActionError) => void;
};

export type ServerActionResult<T = any> =
  | ServerActionSuccess<T>
  | ServerActionError;

export type ServerActionSuccess<T> = {
  ok: true;
  data?: T;
  redirect?: string;
  toast?: { type: "success"; message: string };
} | void;

export type ServerActionError = { ok: false } & (
  | { zodIssues: z.ZodIssue[] }
  | { message: string }
);
