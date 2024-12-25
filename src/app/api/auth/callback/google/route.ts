import { cookies as nextCookies } from "next/headers";
import { NextRequest } from "next/server";

import { ID, Paths } from "@/constants/utils";
import { OAuth2RequestError } from "arctic";
import { eq } from "drizzle-orm";

import { db, schema } from "@/servers/db";
import { google, lucia } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const cookies = await nextCookies();
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  const storedState = cookies.get("google_oauth_state")?.value;
  const storedCodeVerifier = cookies.get("google_oauth_code_verifier")?.[
    "value"
  ];

  if (!code || !state || !storedState || !storedCodeVerifier) {
    return new Response("Invalid request", {
      status: 400,
      headers: { Location: Paths.Login },
    });
  }

  // Additional state validation
  if (state !== storedState) {
    return new Response("State mismatch", {
      status: 400,
      headers: { "Content-Type": "text/plain" },
    });
  }

  try {
    // Validate authorization code
    const tokens = await google.validateAuthorizationCode(
      code,
      storedCodeVerifier
    );

    // Fetch user information
    const googleUserResponse = await fetch(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      { headers: { Authorization: `Bearer ${tokens.accessToken()}` } }
    );
    if (!googleUserResponse.ok) throw new Error("Failed to fetch user info");
    const googleUser = (await googleUserResponse.json()) as GoogleUser;

    if (!googleUser.email || !googleUser?.verified_email) {
      return new Response(
        "Your Google account must have a verified email address.",
        { status: 400, headers: { Location: Paths.Login } }
      );
    }

    // Find existing user
    const existingUser = await db.query.users.findFirst({
      columns: { id: true, googleId: true, image: true, emailVerified: true },
      where: (s, orm) => orm.eq(s?.email, googleUser.email),
    });

    // Update existing user if needed
    if (existingUser) {
      await db.transaction(async (tx) => {
        if (
          !existingUser?.googleId ||
          existingUser?.googleId !== googleUser?.id
        ) {
          await tx
            .update(schema?.users)
            .set({ googleId: googleUser?.id })
            .where(eq(schema?.users?.id, existingUser?.id));
        }

        if (!existingUser.image) {
          await tx
            .update(schema?.users)
            .set({ image: googleUser.picture })
            .where(eq(schema?.users?.id, existingUser?.id));
        }

        if (!existingUser.emailVerified) {
          await tx
            .update(schema?.users)
            .set({ emailVerified: googleUser.verified_email })
            .where(eq(schema?.users?.id, existingUser?.id));
        }
      });

      // Create session for existing user
      const session = await lucia.createSession(existingUser.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);

      // Set session cookies
      const response = new Response(null, {
        status: 302,
        headers: {
          Location: Paths.Dashboard,
          "Set-Cookie": sessionCookie.serialize(),
        },
      });

      return response;
    }

    // Create new user
    const userId = ID.generate();
    await db.insert(schema?.users).values({
      id: userId,
      googleId: googleUser.id,
      email: googleUser.email,
      emailVerified: googleUser?.verified_email,
      // name: googleUser.name,
      image: googleUser.picture,
    });

    // Create session for new user
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Redirect with session cookie

    return new Response(null, {
      status: 302,
      headers: {
        Location: Paths.Dashboard,
        "Set-Cookie": sessionCookie.serialize(),
      },
    });
  } catch (e) {
    console.error("OAuth Callback Error:", e);

    // the specific error message depends on the provider
    if (e instanceof OAuth2RequestError) {
      return new Response("OAuth Request Error", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new Response("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}
