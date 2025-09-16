"use server";

import { cookies as nextCookies } from "next/headers";

import { Paths } from "@/constants";
import { db, orm, schema } from "@/db";
import { generateCodeVerifier, generateState } from "arctic";
import { isWithinExpirationDate } from "oslo";
import { z } from "zod";

import { getDictionary } from "@/servers/locale";
import { createServerAction, hash, userHelpers, verify } from "@/servers/utils";
import { getAuth, google, lucia } from "@/lib/auth";
import { mailer } from "@/lib/mailer";
import { getURL, ID } from "@/lib/utils";
import { Validation, validations } from "@/lib/validations";

export const loginWithPassword = createServerAction(
  async (formData: Validation["login-with-password"]) => {
    const data = validations["login-with-password"]?.parse(formData);
    const { actions: c } = await getDictionary();
    const cookies = await nextCookies();

    const existingUser = await db.query.users.findFirst({
      where: (s, { eq }) => eq(s.email, data?.email),
    });

    if (!existingUser)
      throw new z.ZodError([
        {
          code: "custom",
          path: ["email"],
          message: c["incorrect email address."],
        },
      ]);

    if (!existingUser?.password)
      throw new Error(
        c["no password setted to that account, login using google."]
      );

    const validPassword = await verify(existingUser?.password, data?.password);

    if (!validPassword)
      throw new z.ZodError([
        {
          code: "custom",
          path: ["password"],
          message: c["incorrect password"],
        },
      ]);

    const session = await lucia.createSession(existingUser?.id, {});
    const sessionCookie = lucia.createSessionCookie(session?.id);
    cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return { ok: true, redirect: Paths.Dashboard };
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

  return { ok: true, redirect: url?.toString() };
});

export const logout = createServerAction(async () => {
  const { actions: c } = await getDictionary();
  const cookies = await nextCookies();
  const { session } = await getAuth();
  if (!session) throw new Error(c["you are not logged in."]);

  await lucia.invalidateSession(session?.id);
  const sessionCookie = lucia.createBlankSessionCookie();
  cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  return { ok: true, redirect: Paths.Login };
});

export const registerWithPassword = createServerAction(
  async (formData: Validation["register-with-password"]) => {
    const data = validations["register-with-password"]?.parse(formData);
    const { locale, actions: c, emails } = await getDictionary();
    const cookies = await nextCookies();

    const existingUser = await db.query.users.findFirst({
      columns: { email: true },
      where: (s, { eq }) => eq(s.email, data?.email),
    });

    if (existingUser)
      throw new z.ZodError([
        {
          code: "custom",
          path: ["email"],
          message: c["this email has been already used."],
        },
      ]);

    const userId = ID.generate();
    const passwordHash = await hash(data?.password);
    const emailVerificationDetails = userHelpers?.generateVerificationCode({
      email: data?.email,
    });

    await db.insert(schema?.users).values({
      id: userId,
      email: data?.email,
      password: passwordHash,
      emailVerificationDetails,
    });

    await mailer.send(data?.email, "verify-email", {
      ...emailVerificationDetails,
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session?.id);
    cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return { ok: true, redirect: Paths.VerifyEmail };
  },
  { defaultMessage: "your user account was not created. please try again." }
);

export const resendVerificationEmail = createServerAction(async () => {
  const { actions: c } = await getDictionary();

  const { user } = await getAuth();
  if (!user) return { ok: true, redirect: Paths.Login };

  const existingUser = await db.query.users.findFirst({
    where: (s, { eq }) => eq(s.id, user?.id),
  });

  if (!existingUser?.emailVerificationDetails) {
    throw new Error("No verification details found");
  }

  const { expiresAt } = existingUser?.emailVerificationDetails;
  if (isWithinExpirationDate(new Date(expiresAt))) {
    const timeLeft = timeFromNow(new Date(expiresAt));
    throw new Error(`Please wait ${timeLeft} before resending.`);
  }

  const emailVerificationDetails = userHelpers?.generateVerificationCode({
    email: user.email,
  });

  await db
    .update(schema?.users)
    .set({ emailVerificationDetails })
    .where(orm.eq(schema?.users.id, user.id));

  await mailer.send(user.email, "verify-email", {
    ...emailVerificationDetails,
  });

  return {
    ok: true,
    toast: {
      type: "success",
      message: "resent successfully, check your email.",
    },
  };
});

export const verifyEmail = createServerAction(
  async (formData: Validation["verify-email"]) => {
    const data = validations["verify-email"]?.parse(formData);
    const cookies = await nextCookies();
    const { actions: c } = await getDictionary();

    const { user } = await getAuth();
    if (!user) return { ok: true, redirect: Paths.Login };

    const existingUser = await db.query.users.findFirst({
      where: (s, { eq }) => eq(s.id, user?.id),
    });

    if (!existingUser?.emailVerificationDetails) {
      throw new Error("No verification details found");
    }

    const { code, expiresAt } = existingUser?.emailVerificationDetails;

    if (code !== data?.code) throw new Error("Invalid verification code");

    if (!isWithinExpirationDate(new Date(expiresAt)))
      throw new Error("Verification code expired");

    await lucia.invalidateUserSessions(user.id);
    await db
      .update(schema?.users)
      .set({
        emailVerified: true,
        emailVerificationDetails: null,
      })
      .where(orm.eq(schema?.users.id, user?.id));

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
  async (formData: Validation["send-password-reset-link"]) => {
    const data = validations["send-password-reset-link"]?.parse(formData);
    const { actions: c } = await getDictionary();

    const user = await db.query.users.findFirst({
      columns: { id: true, emailVerified: true, resetPasswordDetails: true },
      where: (s, { eq }) => eq(s.email, data?.email),
    });

    if (!user || !user.emailVerified) {
      throw new Error("Provided email is invalid.");
    }

    if (
      user.resetPasswordDetails &&
      isWithinExpirationDate(new Date(user.resetPasswordDetails.expiresAt))
    ) {
      const timeLeft = timeFromNow(
        new Date(user.resetPasswordDetails.expiresAt)
      );
      throw new Error(`Please wait ${timeLeft} before resending.`);
    }

    const resetPasswordDetails = userHelpers.generateResetPasswordToken();
    await db
      .update(schema?.users)
      .set({ resetPasswordDetails })
      .where(orm.eq(schema?.users.id, user.id));

    const resetLink = `${getURL()}/reset-password/${resetPasswordDetails?.token}`;

    await mailer.send(data?.email, "send-password-reset-link", {
      ...resetPasswordDetails,
      token: resetLink,
    });

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
  async (formData: Validation["reset-password"]) => {
    const data = validations["reset-password"]?.parse(formData);
    const cookies = await nextCookies();
    const { actions: c } = await getDictionary();

    if (data?.password !== data?.confirmPassword)
      throw new z.ZodError([
        {
          code: "custom",
          path: ["confirmPassword"],
          message: "the passwords doesn't match.",
        },
      ]);

    // TODO: handle it from users/schema
    const user = await db
      .execute(
        orm.sql`SELECT id, reset_details FROM users WHERE "reset_details" ->> 'token' = ${data?.token} LIMIT 1`
      )
      ?.then(
        (r) =>
          ({
            ...r?.rows[0],
            resetPasswordDetails: r?.rows[0]?.reset_details,
          }) as {
            id: string;
            resetPasswordDetails: Validation["password-reset-schema"];
          }
      );

    if (
      !user ||
      !user.resetPasswordDetails ||
      user.resetPasswordDetails?.token !== data?.token
    )
      throw new Error("Invalid password reset link.");

    if (user.resetPasswordDetails?.used)
      throw new Error("This password reset link has been used before.");

    if (!isWithinExpirationDate(new Date(user.resetPasswordDetails?.expiresAt)))
      throw new Error("Password reset link expired.");

    await lucia.invalidateUserSessions(user.id);
    const password = await hash(data?.password);

    await db
      .update(schema?.users)
      .set({
        password,
        resetPasswordDetails: null,
      })
      .where(orm.eq(schema?.users.id, user.id));

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return { ok: true, redirect: Paths.Dashboard };
  }
);

const timeFromNow = (time: Date) => {
  const now = new Date();
  const diff = time.getTime() - now.getTime();
  const minutes = Math.floor(diff / 1000 / 60);
  const seconds = Math.floor(diff / 1000) % 60;
  return `${minutes}m ${seconds}s`;
};
