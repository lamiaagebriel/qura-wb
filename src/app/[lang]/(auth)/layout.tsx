import { redirect } from "next/navigation";

import { getAuth } from "@/lib/auth";
import { LocaleProps } from "@/types/locale";

type AuthLayoutProps = Readonly<{
  children: React.ReactNode;
  params: LocaleProps;
}>;

export default async function AuthLayout({
  children,
  params: { lang },
}: AuthLayoutProps) {
  const { user } = await getAuth();
  if (user) redirect(`/${lang}/dashboard`);

  return <div className="flex flex-1 flex-col">{children}</div>;
}
