import type { Metadata } from "next";
import { and, eq, ne } from "drizzle-orm";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/guard";
import { getOAuthProviderDisplayName } from "@/lib/auth/oauth/registry";
import { getLocale } from "@/lib/i18n/actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Dashboard")} — Qura` };
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function DashboardPage() {
  const { t, locale } = await getLocale();

  // `/dashboard`'s layout already guarantees a signed-in, verified,
  // non-suspended user before any page under it renders — this just reads
  // that same (request-cached) session again rather than re-validating it.
  // The null check is defensive only; it should never actually trigger.
  const user = await getCurrentUser();
  if (!user) return null;

  const linkedAccounts = await db.query.accounts.findMany({
    where: and(
      eq(schema.accounts.userId, user.id),
      ne(schema.accounts.providerId, "credential"),
    ),
  });

  const joined = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    user.createdAt,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-foreground text-[24px] font-bold tracking-tight">
          {t("Welcome back, {{name}}.").replace(
            "{{name}}",
            user.name.split(" ")[0],
          )}
        </h1>
        <p className="text-muted-foreground mt-1 text-[13.5px]">
          {t("Here's your account at a glance.")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("Account")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              {user.image && (
                <AvatarImage src={user.image} alt={user.name} />
              )}
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5">
              <span className="text-foreground text-[14px] font-semibold">
                {user.name}
              </span>
              <span className="text-muted-foreground text-[12.5px]">
                {user.email}
              </span>
            </div>
            <Badge variant="success" className="ms-auto shrink-0">
              {t("Verified")}
            </Badge>
          </div>

          <div className="border-border flex flex-col gap-2 border-t pt-4 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("Joined")}</span>
              <span className="text-foreground font-medium">{joined}</span>
            </div>
            {linkedAccounts.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("Signed in with")}
                </span>
                <span className="text-foreground font-medium">
                  {linkedAccounts
                    .map((account) =>
                      getOAuthProviderDisplayName(account.providerId),
                    )
                    .join(", ")}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("What's next")}</CardTitle>
          <CardDescription>
            {t(
              "Profile creation is coming in the next step — once it's ready, you'll be able to publish your services and start getting discovered.",
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
