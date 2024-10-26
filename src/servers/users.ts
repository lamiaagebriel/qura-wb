"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { handleError, hash, verify } from "@/servers/utils";
import { userLoginSchema, userRegisterSchema } from "@/validations/users";
import { generateCodeVerifier, generateState } from "arctic";
import * as z from "zod";

import { getAuth, google, lucia } from "@/lib/auth";
import { db } from "@/lib/db";
import { ID } from "@/lib/utils";

export async function signUpWithPassword(data: z.infer<typeof userRegisterSchema>) {
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

		if (existingEmail) throw new Error("This email is already used.");

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

		redirect(`/dashboard`);
	} catch (error: any) {
		return handleError({ error });
	}
}

export async function signInWithPassword(data: z.infer<typeof userLoginSchema>) {
	try {
		const existingUser = await db.user.findFirst({
			where: {
				email: {
					equals: data?.["email"],
					mode: "insensitive",
				},
			},
		});
		if (!existingUser) throw new Error("No such a user.");
		if (!existingUser?.["password"]) throw new Error("No password, login with google.");

		const validPassword = await verify(existingUser?.["password"], data?.["password"]);
		if (!validPassword) throw new Error("Incorrect password");

		const session = await lucia.createSession(existingUser?.["id"], {});
		const sessionCookie = lucia.createSessionCookie(session?.["id"]);
		(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

		redirect(`/dashboard`);
	} catch (error: any) {
		return handleError({ error });
	}
}

export async function signInWithGoogle() {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();

	const url = google.createAuthorizationURL(state, codeVerifier, ["profile", "email"]);

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
	try {
		const { session } = await getAuth();
		if (!session) throw new Error("You are not logged in.");

		await lucia.invalidateSession(session?.["id"]);
		const sessionCookie = lucia.createBlankSessionCookie();
		(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

		redirect(`/login`);
	} catch (error: any) {
		return handleError({ error });
	}
}
