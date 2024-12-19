import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";

import { logout } from "@/servers/auth";
import { localeSwitcher } from "@/servers/locale";
import { geAuth } from "@/lib/auth";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormButton, FormInputField } from "@/components/ui/form";
import { Icons } from "@/components/icons";

type DashboardProps = Readonly<{}>;
export const metadata: Metadata = { title: "Dashboard" };
export default async function Dashboard({}: DashboardProps) {
  const { user } = await geAuth();
  if (!user) redirect(Paths.Login);

  return (
    <div>
      Dashboard
      <Avatar>
        <AvatarImage src={user?.["image"]!} />
        <AvatarFallback>
          <Icons.user />
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm text-muted-foreground">{user?.["email"]}</p>
      </div>
      <FormButton infiniteLoading onAction={logout}>
        logout
      </FormButton>
    </div>
  );
}
