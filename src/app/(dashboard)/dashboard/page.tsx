import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";
import { logout } from "@/servers/auth";

import { geAuth } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

type DashboardProps = Readonly<{}>;
export const metadata: Metadata = { title: "Dashboard" };
export default async function Dashboard({}: DashboardProps) {
  const { user } = await geAuth();
  if (!user) redirect(Paths.Login);

  return (
    <div>
      Dashboard
      <br />
      <br />
      {JSON.stringify(user)}
      <br />
      <Form actions={{ onSubmit: logout }}>
        <Button type="submit">Logout</Button>
      </Form>
    </div>
  );
}
