"use server";

import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getLocale, hash, verify } from "@/servers/helpers";
import {
  userAuthLoginSchema,
  userAuthRegisterSchema,
} from "@/validations/users";
import { generateCodeVerifier, generateState } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import * as z from "zod";

import { getAuth, google, lucia } from "@/lib/auth";
import { db } from "@/lib/db";

export async function signUpWithPassword(
  credentials: z.infer<typeof userAuthRegisterSchema>
) {
  try {
    const { name, email, password } = userAuthRegisterSchema.parse(credentials);
    const passwordHash = await hash(password);

    const existingEmail = await db.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (existingEmail) return { error: "This email is already used." };

    const userId = generateIdFromEntropySize(10);
    await db.user.create({
      data: {
        id: userId,
        name,
        email,
        password: passwordHash,
      },
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    const locale = await getLocale();
    return redirect(`/${locale}/dashboard`);
  } catch (error: any) {
    if (isRedirectError(error)) return { error };
    return { error: error?.["message"] ?? "an error occured, try again." };
  }
}

export async function signInWithPassword(
  credentials: z.infer<typeof userAuthLoginSchema>
): Promise<{ error?: string }> {
  try {
    const { email, password } = userAuthLoginSchema.parse(credentials);
    const existingUser = await db.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });
    if (!existingUser) return { error: "No such a user." };
    if (!existingUser?.["password"]) return { error: "Incorrect password." };

    const validPassword = await verify(existingUser?.["password"], password);
    if (!validPassword)
      return {
        error: "Incorrect email or password",
      };

    const session = await lucia.createSession(existingUser?.["id"], {});
    const sessionCookie = lucia.createSessionCookie(session?.["id"]);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    const locale = await getLocale();
    return redirect(`/${locale}/dashboard`);
  } catch (error: any) {
    if (isRedirectError(error)) return { error: error?.["message"] };
    return { error: error?.["message"] ?? "an error occured, try again." };
  }
}

export async function signInWithGoogle() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const url = await google.createAuthorizationURL(state, codeVerifier, {
    scopes: ["profile", "email"],
  });

  cookies().set("locale", await getLocale());
  cookies().set("state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  cookies().set("code_verifier", codeVerifier, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return redirect(url.toString());
}

export async function logout() {
  const { session } = await getAuth();
  if (!session) throw new Error("You are not logged in.");

  await lucia.invalidateSession(session?.["id"]);
  const sessionCookie = lucia.createBlankSessionCookie();

  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  const locale = await getLocale();
  return redirect(`/${locale}/login`);
}
