import { ServerActionResult } from "@/types";
import { z } from "zod";

import { getDictionary } from "@/servers/locale";
import { Dictionary } from "@/lib/locale";

export function createServerAction<T, R>(
  actionFn: (data: T) => Promise<ServerActionResult<R>>,
  options?: { defaultMessage?: keyof Dictionary["actions"] }
) {
  return async (data: T): Promise<ServerActionResult<R>> => {
    const { actions: c } = await getDictionary();
    const defaultMessage = options?.defaultMessage
      ? c[options?.defaultMessage]
      : null;

    try {
      return await actionFn(data);
    } catch (error: any) {
      console.error(error);

      // Convert any caught error to a standardized error result
      if (error instanceof z.ZodError)
        return { ok: false, zodIssues: error?.issues };

      return {
        ok: false,
        message:
          error["message"] ??
          defaultMessage ??
          c["an unexpected error occured, please try again later."],
      };
    }
  };
}
