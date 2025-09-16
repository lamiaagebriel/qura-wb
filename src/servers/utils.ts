import { ServerActionResult } from "@/types";
import { Scrypt } from "lucia";
import { createDate, TimeSpan } from "oslo";
import { alphabet, generateRandomString } from "oslo/crypto";
import { z } from "zod";

import { getDictionary } from "@/servers/locale";
import { Dictionary } from "@/lib/locale";
import { ID } from "@/lib/utils";

export async function hash(str: string) {
  return new Scrypt().hash(str);
}
export async function verify(hashed: string, notHashed: string) {
  return new Scrypt().verify(hashed, notHashed);
}

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

export const userHelpers = {
  generateVerificationCode: ({ email }: { email: string }) => ({
    code: generateRandomString(8, alphabet("0-9")), // 8 digit code
    expiresAt: createDate(new TimeSpan(10, "m")), // 10 minutes
    attempts: 0,
    email,
  }),

  generateResetPasswordToken: () => ({
    token: ID.generate({ len: 40 }),
    expiresAt: createDate(new TimeSpan(2, "h")),
    used: false,
  }),

  // isVerificationValid: (
  //   verification: Validation["email-verification-schema"] | null
  // ) => {
  //   if (!verification) return false;
  //   return verification.expiresAt > new Date() && verification.attempts < 5;
  // },

  // isResetTokenValid: (reset: Validation["password-reset-schema"] | null) => {
  //   if (!reset) return false;
  //   return isWithinExpirationDate(new Date(reset.expiresAt)) && !reset.used;
  // },
};
