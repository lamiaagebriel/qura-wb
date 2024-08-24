import { Link } from "@/components/link";
import { getAuth } from "@/lib/auth";
import { logout } from "@/servers/users";
import { LocaleProps } from "@/types/locale";
import { Metadata } from "next";

type HomeProps = Readonly<{
  params: LocaleProps;
}>;
export const metadata: Metadata = { title: "Home" };
export default async function Home({ params: { lang } }: HomeProps) {
  const { user } = await getAuth();

  return (
    <div className="container flex-1 py-6">
      Home
      <br />
      {user ? (
        <form
          action={async () => {
            "use server";
            await logout();
          }}
        >
          <button>logout</button>
        </form>
      ) : (
        <Link href="/login">Login</Link>
      )}
    </div>
  );
}
