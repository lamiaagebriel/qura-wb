import type { FormState } from "react-hook-form";
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
  | ({
      ok: true;
      toast?: {
        type: "success" | "info" | "warning" | "error" | "message";
        message: string;
        data?: ExternalToast;
      };
    } & T)
  | void;
export type ServerActionError = { ok: false } & (
  | { zodIssues: z.ZodIssue[] }
  | { message: string }
);

export type ExtendedFormState = FormState & {
  disabled: boolean;
  setDisabled: React.Dispatch<React.SetStateAction<boolean>>;
};
