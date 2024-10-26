"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getLocale, handleError, hash, verify } from "@/servers/utils";
import { userLoginSchema, userRegisterSchema } from "@/validations/users";
import { generateCodeVerifier, generateState } from "arctic";
import * as z from "zod";

import { getAuth, google, lucia } from "@/lib/auth";
import { db } from "@/lib/db";
import { ID } from "@/lib/utils";
import { getDictionary } from "@/lib/locale";

export async function signUpWithPassword(data: z.infer<typeof userRegisterSchema>) {
	const locale = await getLocale();
	const { actions: c } = await getDictionary(locale);

	try {
		const passwordHash = await hash(data?.["password"]);
		const existingEmail = await db.user.findFirst({
			where: {
				email: {
					equals: data?.["email"],
					mode: "insensitive",
				},
			},
		});

		if (existingEmail)
			return handleError({
				locale,
				error: null,
				message: c?.["this email is already used."],
			});

		const userId = ID.generate();
		await db.user.create({
			data: {
				id: userId,
				name: data?.["name"],
				email: data?.["email"],
				password: passwordHash,
			},
		});

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

		redirect(`/${locale}/dashboard`);
	} catch (error: any) {
		return handleError({
			locale,
			error,
			message: c?.["your user account was not created. please try again."],
		});
	}
}

export async function signInWithPassword(data: z.infer<typeof userLoginSchema>) {
	const locale = await getLocale();
	const { actions: c } = await getDictionary(locale);

	try {
		const existingUser = await db.user.findFirst({
			where: {
				email: {
					equals: data?.["email"],
					mode: "insensitive",
				},
			},
		});
		if (!existingUser)
			return handleError({
				locale,
				error: null,
				message: c?.["incorrect email address."],
			});
		if (!existingUser?.["password"])
			return handleError({
				locale,
				error: null,
				message: c?.["no password setted to that account, login using google."],
			});

		const validPassword = await verify(existingUser?.["password"], data?.["password"]);
		if (!validPassword)
			return handleError({
				locale,
				error: null,
				message: c?.["incorrect password"],
			});

		const session = await lucia.createSession(existingUser?.["id"], {});
		const sessionCookie = lucia.createSessionCookie(session?.["id"]);
		(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

		redirect(`/${locale}/dashboard`);
	} catch (error: any) {
		return handleError({
			locale,
			error,
			message: c?.["your user account was not logged in. please try again."],
		});
	}
}

export async function signInWithGoogle() {
	const locale = await getLocale();
	const state = generateState();
	const codeVerifier = generateCodeVerifier();

	const url = google.createAuthorizationURL(state, codeVerifier, ["profile", "email"]);
	(await cookies()).set("locale", locale, {
		path: "/",
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax",
	});
	(await cookies()).set("state", state, {
		path: "/",
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax",
	});
	(await cookies()).set("code_verifier", codeVerifier, {
		path: "/",
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax",
	});

	redirect(url.toString());
}

export async function logout() {
	const locale = await getLocale();
	const { actions: c } = await getDictionary(locale);

	try {
		const { session } = await getAuth();
		if (!session)
			return handleError({ locale, error: null, message: c?.["you are not logged in."] });

		await lucia.invalidateSession(session?.["id"]);
		const sessionCookie = lucia.createBlankSessionCookie();
		(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

		redirect(`/${locale}/login`);
	} catch (error: any) {
		return handleError({ locale, error });
	}
}
