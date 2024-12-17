import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";
import {
  loginWithPassword,
  registerWithPassword,
  sendPasswordResetLink,
} from "@/servers/auth";
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

type ForgotPasswordProps = Readonly<{}>;
export const metadata: Metadata = { title: "ForgotPassword" };
export default async function ForgotPassword({}: ForgotPasswordProps) {
  const { user } = await geAuth();
  if (user) redirect(Paths.Dashboard);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle> Forgot Password?</CardTitle>
        <CardDescription>
          Password reset link will be sent to your email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          validation="send-password-reset-link-schema"
          formProps={{ defaultValues: { email: "" } }}
          actions={{ onSubmit: sendPasswordResetLink }}
        >
          <FormInputField
            label="Email"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            field={{ name: "email" }}
          />

          <div className="flex flex-wrap justify-between">
            <Button variant={"link"} size={"sm"} className="p-0">
              <Link href={Paths.Register}> Not signed up? Sign up now</Link>
            </Button>
          </div>

          <Button type="submit" className="w-full">
            Reset Password
          </Button>
          <Button variant="outline" className="w-full">
            <Link href="/">Cancel</Link>
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
