import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";

import { logout, resendVerificationEmail, verifyEmail } from "@/servers/auth";
import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";

import { Form, FormButton, FormInputField } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/icons";

type VerifyEmailProps = Readonly<{}>;
export const metadata: Metadata = { title: "Verify Email" };
export default async function VerifyEmail({}: VerifyEmailProps) {
  const { user } = await getAuth();

  if (!user) redirect(Paths.Login);
  if (user.emailVerified) redirect(Paths.Dashboard);

  const { "form-fields": ff, ...dic } = await getDictionary();
  const c = dic?.["auth"]?.["verify-email"];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-auto">
      <section className="container flex w-full max-w-sm flex-col justify-center gap-5">
        <div className="flex flex-col gap-2 text-center">
          <Icons.logo className="mx-auto size-16" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {c?.["verify email"]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {c?.["verification code was sent to"]}{" "}
            <span className="font-bold">{user?.["email"]}</span>.{" "}
            {c?.["check your spam folder if you can't find the email."]}
          </p>
        </div>

        <div>
          <Form
            validation="verify-email"
            useForm={{ defaultValues: { code: "" } }}
            onSubmit={verifyEmail}
          >
            <div className="space-y-2">
              <FormInputField
                label={ff?.["verification code"]?.["verification code"]}
                field={{ name: "code" }}
                placeholder="********"
              />

              <FormButton type="submit" className="w-full">
                {ff?.["verify"]}
              </FormButton>

              <FormButton className="w-full" onAction={resendVerificationEmail}>
                {ff?.["resend code"]}
              </FormButton>
            </div>
            <Separator className="mb-2 mt-4" />

            <FormButton
              variant="link"
              className="text-center text-sm text-muted-foreground"
              onAction={logout}
            >
              {c?.["want to use another email? logout now."]}
            </FormButton>
          </Form>
        </div>
      </section>
    </div>
  );
}
