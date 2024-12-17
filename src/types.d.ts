import { Icons } from "@/components/icons";

export type SelectItem = {
  value: string;
  children: string | React.ReactNode;
  disabled?: boolean;
  // icon?: keyof typeof Icons;
  // color?: string;
};

export type ServerActionResult<T = any> =
  | ServerActionSuccess<T>
  | ServerActionError;
export type ServerActionSuccess<T = any> = (T & { ok: true }) | void;
export type ServerActionError = { ok: false } & (
  | { zodIssues: z.ZodIssue[] }
  | { message: string }
);
