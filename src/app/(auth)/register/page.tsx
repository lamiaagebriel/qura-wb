import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";
import { loginWithPassword, registerWithPassword } from "@/servers/auth";
import { getDictionary } from "@/servers/locale";

import { geAuth } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormInputField } from "@/components/ui/form";
import { Icons } from "@/components/icons";

type RegisterProps = Readonly<{}>;
export const metadata: Metadata = { title: "Register" };
export default async function Register({}: RegisterProps) {
  const { user } = await geAuth();
  const { locale, site, "locale-switcher": c } = await getDictionary();

  if (user) redirect(Paths.Dashboard);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>{site?.["name"]} Register</CardTitle>
        <CardDescription>
          Sign up to your account to access your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href={Paths.LoginGoogle} prefetch={false}>
          <Button variant="outline" className="w-full">
            <Icons.google className="mr-2 h-5 w-5" />
            Log in with Google
          </Button>
        </Link>{" "}
        <div className="my-2 flex items-center">
          <div className="flex-grow border-t border-muted" />
          <div className="mx-2 text-muted-foreground">or</div>
          <div className="flex-grow border-t border-muted" />
        </div>
        <Form
          validation="register-with-password-schema"
          formProps={{ defaultValues: { email: "", password: "" } }}
          actions={{ onSubmit: registerWithPassword }}
        >
          <FormInputField
            label="Email"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            field={{ name: "email" }}
          />
          <FormInputField
            label="Password"
            type="password"
            field={{ name: "password" }}
          />

          <div className="flex flex-wrap justify-between">
            <Button variant={"link"} size={"sm"} className="p-0">
              <Link href={Paths.Login}>Already signed up? Login instead.</Link>
            </Button>
          </div>

          <Button type="submit" className="w-full">
            Sign Up
          </Button>
          <Button variant="outline" className="w-full">
            <Link href="/">Cancel</Link>
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
