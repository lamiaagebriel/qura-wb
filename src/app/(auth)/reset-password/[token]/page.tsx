import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";
import {
  loginWithPassword,
  registerWithPassword,
  resetPassword,
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

type ResetPasswordProps = Readonly<{ params: Promise<{ token: string }> }>;
export const metadata: Metadata = { title: "ResetPassword" };
export default async function ResetPassword({ params }: ResetPasswordProps) {
  const { token } = await params;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle> Reset Password</CardTitle>
        <CardDescription>Enter new password.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          validation="reset-password-schema"
          formProps={{ defaultValues: { token, password: "" } }}
          actions={{ onSubmit: resetPassword }}
        >
          <FormInputField
            label="Password"
            type="password"
            field={{ name: "password" }}
          />

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
