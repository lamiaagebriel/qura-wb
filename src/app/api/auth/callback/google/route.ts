import { cookies } from "next/headers";
import { NextRequest } from "next/server";

import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";

import { google, lucia } from "@/lib/lucia";
import { db } from "@/lib/prisma";

export async function GET(req: NextRequest) {
	const code = req.nextUrl.searchParams.get("code");
	const state = req.nextUrl.searchParams.get("state");

	const storedState = (await cookies()).get("state")?.["value"];
	const storedCodeVerifier = (await cookies()).get("code_verifier")?.["value"];
	const locale = (await cookies()).get("locale")?.["value"];

	if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState)
		return new Response(null, { status: 400 });

	try {
		const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
		const googleUser: {
			id: string;
			name: string;
			email: string;
			picture: string;
			verified_email: boolean;
			given_name: string;
			family_name: string;
		} = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
			headers: { Authorization: `Bearer ${tokens.accessToken()}` },
		}).then((r) => r?.json());

		const existingUser = await db.user.findUnique({
			select: { id: true, googleId: true, image: true },
			where: { email: googleUser?.["email"] },
		});

		if (existingUser) {
			await db.$transaction(async (tx) => {
				if (!existingUser?.["googleId"])
					await tx.user.update({
						data: { googleId: googleUser?.["id"] },
						where: { id: existingUser?.["id"] },
					});

				if (!existingUser?.["image"])
					await tx.user.update({
						data: { image: googleUser?.["picture"] },
						where: { id: existingUser?.["id"] },
					});
			});

			const session = await lucia.createSession(existingUser?.["id"], {});
			const sessionCookie = lucia.createSessionCookie(session?.["id"]);

			(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

			return new Response(null, {
				status: 302,
				headers: { Location: `${locale ? `/${locale}` : ""}/dashboard` },
			});
		}

		const userId = generateIdFromEntropySize(10);
		await db.user.create({
			data: {
				id: userId,
				name: googleUser?.["name"],
				email: googleUser?.["email"],
				image: googleUser?.["picture"],
				googleId: googleUser?.["id"],
			},
		});

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session?.["id"]);

		(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

		return new Response(null, {
			status: 302,
			headers: { Location: `${locale ? `/${locale}` : ""}/dashboard` },
		});
	} catch (err: any) {
		console.error(err);
		if (err instanceof OAuth2RequestError) return new Response(null, { status: 400 });
		return new Response(null, { status: 500 });
	}
}
