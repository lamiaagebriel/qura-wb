import { cookies } from "next/headers";
import { cache } from "react";

import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { User as dbUser } from "@prisma/client";
import { Google } from "arctic";
import { Lucia, Session, User } from "lucia";

import { db } from "@/lib/db";
import { getURL } from "@/lib/utils";

const adapter = new PrismaAdapter(db?.["session"], db?.["user"]);
export const google = new Google(
	process.env.GOOGLE_CLIENT_ID!,
	process.env.GOOGLE_CLIENT_SECRET!,
	`${getURL()}/api/auth/callback/google`,
);
export const lucia = new Lucia(adapter, {
	sessionCookie: {
		expires: false,
		attributes: {
			secure: process.env.NODE_ENV === "production",
		},
	},
	getUserAttributes(dbUser) {
		return {
			id: dbUser?.["id"],
			name: dbUser?.["name"],
			email: dbUser?.["email"],
			image: dbUser?.["image"],
		};
	},
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}
type DatabaseUserAttributes = Pick<dbUser, "id" | "name" | "email" | "image">;

export const getAuth = cache(
	async (): Promise<{ user: User; session: Session } | { user: null; session: null }> => {
		const sessionId = (await cookies()).get(lucia.sessionCookieName)?.["value"] ?? null;

		if (!sessionId) {
			return {
				user: null,
				session: null,
			};
		}

		const result = await lucia.validateSession(sessionId);

		try {
			if (result?.["session"] && result?.["session"]?.["fresh"]) {
				const sessionCookie = lucia.createSessionCookie(result?.["session"]?.["id"]);
				(await cookies()).set(
					sessionCookie?.["name"],
					sessionCookie?.["value"],
					sessionCookie?.["attributes"],
				);
			}

			if (!result?.["session"]) {
				const sessionCookie = lucia.createBlankSessionCookie();
				(await cookies()).set(
					sessionCookie?.["name"],
					sessionCookie?.["value"],
					sessionCookie?.["attributes"],
				);
			}
		} catch (err: any) {
			console.error(`getAuth error: ${err?.["message"]}`);
		}

		return result;
	},
);
