import { ToastT } from "sonner";

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
export type ServerActionSuccess<T = any> =
  | (T & {
      ok: true;
      redirect?: string;
      toast?: {
        type: "success" | "info" | "warning" | "error" | "message";
        message: titleT | React.ReactNode;
        data?: ExternalToast;
      };
    })
  | void;
export type ServerActionError = { ok: false } & (
  | { zodIssues: z.ZodIssue[] }
  | { message: string }
);
