import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

import { google, lucia } from "@/lib/auth";
import { db } from "@/lib/db";
import { kyInstance } from "@/lib/ky";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  const locale = cookies().get("locale")?.["value"];
  const storedState = cookies().get("state")?.["value"];
  const storedCodeVerifier = cookies().get("code_verifier")?.["value"];

  if (
    !code ||
    !state ||
    !storedState ||
    !storedCodeVerifier ||
    state !== storedState
  ) {
    return new Response(null, { status: 400 });
  }

  try {
    const tokens = await google.validateAuthorizationCode(
      code,
      storedCodeVerifier
    );

    const googleUser = await kyInstance
      .get("https://www.googleapis.com/oauth2/v1/userinfo", {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      })
      .json<{
        id: string;
        name: string;
        email: string;
        picture: string;
        verified_email: boolean;
        given_name: string;
        family_name: string;
      }>();

    const existingUser = await db.user.findUnique({
      where: { email: googleUser?.["email"] },
    });

    if (existingUser) {
      if (!existingUser?.["googleId"] || !existingUser?.["image"])
        await db.user.update({
          data: {
            image: googleUser?.["picture"],
            googleId: googleUser?.["id"],
          },
          where: { email: googleUser?.["email"] },
        });

      const session = await lucia.createSession(existingUser?.["id"], {});
      const sessionCookie = lucia.createSessionCookie(session?.["id"]);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/${locale}/dashboard`,
        },
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
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return new Response(null, {
      status: 302,
      headers: {
        Location: `/${locale}/dashboard`,
      },
    });
  } catch (error) {
    console.error(error);
    if (error instanceof OAuth2RequestError) {
      return new Response(null, {
        status: 400,
      });
    }
    return new Response(null, {
      status: 500,
    });
  }
}
