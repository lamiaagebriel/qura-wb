import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";
import { logout, resendVerificationEmail, verifyEmail } from "@/servers/auth";

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

type VerifyEmailProps = Readonly<{}>;
export const metadata: Metadata = { title: "VerifyEmail" };
export default async function VerifyEmail({}: VerifyEmailProps) {
  const { user } = await geAuth();

  if (!user) redirect(Paths.Login);
  if (user.emailVerified) redirect(Paths.Dashboard);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Verify Email</CardTitle>
        <CardDescription>
          Verification code was sent to <strong>{user.email}</strong>. Check
          your spam folder if you can't find the email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full">
          {/* <Link href="/login/discord" prefetch={false}>
            <Icons.google className="mr-2 h-5 w-5" />
            Log in with Discord
          </Link> */}
        </Button>
        <div className="my-2 flex items-center">
          <div className="flex-grow border-t border-muted" />
          <div className="mx-2 text-muted-foreground">or</div>
          <div className="flex-grow border-t border-muted" />
        </div>

        <Form
          validation="verify-email-schema"
          formProps={{ defaultValues: { code: "" } }}
          actions={{ onSubmit: verifyEmail }}
        >
          <FormInputField
            label="Verification Code"
            placeholder="********"
            field={{ name: "code" }}
          />

          <Button type="submit" className="w-full">
            Verify
          </Button>
          <Button variant="outline" className="w-full">
            <Link href="/">Cancel</Link>
          </Button>
        </Form>

        <Form actions={{ onSubmit: resendVerificationEmail }}>
          <Button type="submit" className="w-full">
            Resend Code
          </Button>
        </Form>

        <Form actions={{ onSubmit: logout }}>
          <Button type="submit" variant="link" className="p-0 font-normal">
            want to use another email? Log out now.
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
