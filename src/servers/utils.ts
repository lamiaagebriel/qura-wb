import { ServerActionResult } from "@/types";
import { z } from "zod";

export function createServerAction<T, R>(
  actionFn: (data: T) => Promise<ServerActionResult<R>>
) {
  return async (data: T): Promise<ServerActionResult<R>> => {
    try {
      return await actionFn(data);
    } catch (error: any) {
      // Convert any caught error to a standardized error result
      if (error instanceof z.ZodError) {
        return { ok: false, zodIssues: error?.["issues"] };
      }

      return {
        ok: false,
        message: error?.["message"] ?? "Unexpected Error Occurred.",
      };
    }
  };
}
