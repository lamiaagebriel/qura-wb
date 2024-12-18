"use server";

import { cookies as nextCookies } from "next/headers";
import { redirect } from "next/navigation";

import { ID, Paths } from "@/constants/utils";
import { generateCodeVerifier, generateState } from "arctic";
import { createDate, isWithinExpirationDate, TimeSpan } from "oslo";
import { alphabet, generateRandomString } from "oslo/crypto";
import { z } from "zod";

import { db, orm, schema } from "@/servers/db";
import { getDictionary } from "@/servers/locale";
import { createServerAction, hash, verify } from "@/servers/utils";
import { geAuth, google, lucia } from "@/lib/auth";
import { getURL } from "@/lib/utils";
import { Validation, validations } from "@/lib/validations";

export const loginWithPassword = createServerAction(
  async (formData: Validation["login-with-password-schema"]) => {
    const data = validations?.["login-with-password-schema"]?.parse(formData);
    const { actions: c } = await getDictionary();
    const cookies = await nextCookies();

    const existingUser = await db.query.users.findFirst({
      where: (table, { eq }) => eq(table.email, data?.["email"]),
    });

    if (!existingUser)
      throw new z.ZodError([
        {
          code: "custom",
          path: ["email"],
          message: c?.["incorrect email address."],
        },
      ]);

    if (!existingUser?.["password"])
      throw new Error(
        c?.["no password setted to that account, login using google."]
      );

    const validPassword = await verify(
      existingUser?.["password"],
      data?.["password"]
    );

    if (!validPassword)
      throw new z.ZodError([
        {
          code: "custom",
          path: ["password"],
          message: c?.["incorrect password"],
        },
      ]);

    const session = await lucia.createSession(existingUser?.["id"], {});
    const sessionCookie = lucia.createSessionCookie(session?.["id"]);
    cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    redirect(Paths.Dashboard);
  },
  { defaultMessage: "your user account was not logged in. please try again." }
);

export const loginWithGoogle = createServerAction(async () => {
  const cookies = await nextCookies();
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const url = google.createAuthorizationURL(state, codeVerifier, [
    "profile",
    "email",
  ]);

  cookies.set("google_oauth_state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: "lax",
  });
  cookies.set("google_oauth_code_verifier", codeVerifier, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: "lax",
  });

  redirect(url?.toString());
});

export const logout = createServerAction(async () => {
  const { actions: c } = await getDictionary();
  const cookies = await nextCookies();
  const { session } = await geAuth();
  if (!session) throw new Error(c?.["you are not logged in."]);

  await lucia.invalidateSession(session?.["id"]);
  const sessionCookie = lucia.createBlankSessionCookie();
  cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  redirect(Paths.Home);
});

export const registerWithPassword = createServerAction(
  async (formData: Validation["register-with-password-schema"]) => {
    const data =
      validations?.["register-with-password-schema"]?.parse(formData);
    const { actions: c } = await getDictionary();
    const cookies = await nextCookies();

    const existingUser = await db.query.users.findFirst({
      columns: { email: true },
      where: (table, { eq }) => eq(table.email, data?.["email"]),
    });

    if (existingUser)
      throw new z.ZodError([
        {
          code: "custom",
          path: ["email"],
          message: c?.["this email has been already used."],
        },
      ]);

    const userId = ID.generate();
    const passwordHash = await hash(data?.["password"]);
    await db.insert(schema?.["users"]).values({
      id: userId,
      email: data?.["email"],
      password: passwordHash,
    });

    const verificationCode = await generateEmailVerificationCode({
      userId,
      email: data?.["email"],
    });

    console.log({ verificationCode });

    // await sendMail(email, EmailTemplate.EmailVerification, { code: verificationCode });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session?.["id"]);
    cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    redirect(Paths.VerifyEmail);
  },
  { defaultMessage: "your user account was not created. please try again." }
);

export const resendVerificationEmail = createServerAction(async () => {
  const { actions: c } = await getDictionary();

  const { user } = await geAuth();
  if (!user) return redirect(Paths.Login);

  const lastSent = await db.query.emailVerificationCodes.findFirst({
    columns: { expiresAt: true },
    where: (s, orm) => orm.eq(s?.["userId"], user?.["id"]),
  });

  if (lastSent && isWithinExpirationDate(lastSent.expiresAt)) {
    console.log(
      `Please wait ${timeFromNow(lastSent.expiresAt)} before resending.`
    );

    throw new Error(
      `Please wait ${timeFromNow(lastSent.expiresAt)} before resending.`
    );
  }
  const verificationCode = await generateEmailVerificationCode({
    userId: user.id,
    email: user.email,
  });

  console.log({ verificationCode });

  // await sendMail(user.email, EmailTemplate.EmailVerification, {
  //   code: verificationCode,
  // });

  return {
    ok: true,
    toast: {
      type: "success",
      message: "resent successfully, check your email.",
    },
  };
});

export const verifyEmail = createServerAction(
  async (formData: Validation["verify-email-schema"]) => {
    const data = validations?.["verify-email-schema"]?.parse(formData);
    const cookies = await nextCookies();
    const { actions: c } = await getDictionary();

    const { user } = await geAuth();
    if (!user) return redirect(Paths.Login);

    const dbCode = await db.transaction(async (tx) => {
      const item = await tx.query.emailVerificationCodes.findFirst({
        columns: { id: true, email: true, expiresAt: true },
        where: (s, orm) =>
          orm.and(
            orm.eq(s?.["userId"], user?.["id"]),
            orm.eq(s?.["email"], user?.["email"]),
            orm.eq(s?.["code"], data?.["code"])
          ),
      });

      if (item) {
        await tx
          .delete(schema?.["emailVerificationCodes"])
          .where(
            orm.eq(schema?.["emailVerificationCodes"]?.["id"], item?.["id"])
          );
      }

      return item;
    });

    if (!dbCode) throw new Error("Invalid verification code");

    if (!isWithinExpirationDate(dbCode.expiresAt))
      throw new Error("Verification code expired");

    await lucia.invalidateUserSessions(user.id);

    await db
      .update(schema?.["users"])
      .set({ emailVerified: true })
      .where(orm.eq(schema?.["users"]?.["id"], user?.["id"]));

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return {
      ok: true,
      redirect: Paths.Dashboard,
      toast: {
        type: "success",
        message: "email has been verified successfully.",
      },
    };
  }
);

export const sendPasswordResetLink = createServerAction(
  async (formData: Validation["send-password-reset-link-schema"]) => {
    const data =
      validations?.["send-password-reset-link-schema"]?.parse(formData);
    const cookies = await nextCookies();
    const { actions: c } = await getDictionary();

    const user = await db.query.users.findFirst({
      columns: { id: true, emailVerified: true },
      where: (s, orm) => orm.eq(s?.["email"], data?.["email"]),
    });

    if (!user || !user.emailVerified)
      throw new Error("Provided email is invalid.");

    const lastSent = await db.query.passwordResetTokens.findFirst({
      columns: { expiresAt: true },
      where: (s, orm) => orm.eq(s?.["userId"], user?.["id"]),
    });

    if (lastSent && isWithinExpirationDate(lastSent.expiresAt))
      throw new Error(
        `Please wait ${timeFromNow(lastSent.expiresAt)} before resending.`
      );

    const verificationToken = await generatePasswordResetToken(user.id);

    const verificationLink = `${getURL()}/reset-password/${verificationToken}`;

    console.log({ verificationLink });

    // await sendMail(user.email, EmailTemplate.PasswordReset, {
    //   link: verificationLink,
    // });

    return {
      ok: true,
      toast: {
        type: "success",
        message: "A password reset link has been sent to your email.",
      },
    };
  }
  // { defaultMessage: "Failed to send verification email." }
);

export const resetPassword = createServerAction(
  async (formData: Validation["reset-password-schema"]) => {
    const data = validations?.["reset-password-schema"]?.parse(formData);
    const cookies = await nextCookies();
    const { actions: c } = await getDictionary();
    if (data?.["password"] !== data?.["confirmPassword"])
      throw new z.ZodError([
        {
          code: "custom",
          path: ["confirmPassword"],
          message: "the passwords doesn't match.",
        },
      ]);

    const token = await db.transaction(async (tx) => {
      const item = await tx.query.passwordResetTokens.findFirst({
        where: (s, orm) => orm.eq(s?.["id"], data?.["token"]),
      });

      if (item)
        await tx
          .delete(schema?.["passwordResetTokens"])
          .where(orm.eq(schema?.["passwordResetTokens"]?.["id"], item?.["id"]));

      return item;
    });

    if (!token) throw new Error("Invalid password reset link");

    if (!isWithinExpirationDate(token.expiresAt))
      throw new Error("Password reset link expired.");

    await lucia.invalidateUserSessions(token.userId);
    const password = await hash(data?.["password"]);
    await db
      .update(schema?.["users"])
      .set({ password })
      .where(orm.eq(schema?.["users"]?.["id"], token?.["userId"]));

    const session = await lucia.createSession(token?.["userId"], {});
    const sessionCookie = lucia.createSessionCookie(session?.["id"]);
    cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    redirect(Paths.Dashboard);
  }
);

const timeFromNow = (time: Date) => {
  const now = new Date();
  const diff = time.getTime() - now.getTime();
  const minutes = Math.floor(diff / 1000 / 60);
  const seconds = Math.floor(diff / 1000) % 60;
  return `${minutes}m ${seconds}s`;
};

async function generateEmailVerificationCode({
  userId,
  email,
}: {
  userId: string;
  email: string;
}): Promise<string> {
  await db
    .delete(schema?.["emailVerificationCodes"])
    .where(orm.eq(schema?.["emailVerificationCodes"]?.["userId"], userId));

  const code = generateRandomString(8, alphabet("0-9")); // 8 digit code
  await db.insert(schema?.["emailVerificationCodes"]).values({
    userId,
    email,
    code,
    expiresAt: createDate(new TimeSpan(10, "m")), // 10 minutes
  });

  return code;
}

async function generatePasswordResetToken(userId: string): Promise<string> {
  await db
    .delete(schema?.["passwordResetTokens"])
    .where(orm.eq(schema?.["passwordResetTokens"]?.["userId"], userId));

  const tokenId = ID.generate({ len: 40 });
  await db.insert(schema?.["passwordResetTokens"]).values({
    id: tokenId,
    userId,
    expiresAt: createDate(new TimeSpan(2, "h")),
  });

  return tokenId;
}
