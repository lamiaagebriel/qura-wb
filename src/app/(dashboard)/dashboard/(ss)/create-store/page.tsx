import Link from "next/link";

import { Paths } from "@/constants";

import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StoreCreateButton } from "@/components/store-create-button";

export const metadata = {
  title: "How it works",
};

export default async function HowItWorksPage() {
  const { user } = await getAuth();
  const dic = await getDictionary();
  const cmn = dic["cmn"];

  return (
    <main className="flex-1">
      <div className="container flex flex-1 flex-col py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">How Qura Works</h1>
          <p className="text-muted-foreground max-w-prose">
            Create your store, add products, and start selling in minutes.
          </p>
        </div>

        <Separator className="my-8" />

        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-2">
            <div className="text-lg font-semibold">1. Create your store</div>
            <p className="text-muted-foreground text-sm">
              Pick a store name, username, logo, and a short bio.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-lg font-semibold">2. Add products</div>
            <p className="text-muted-foreground text-sm">
              Add items, set prices, and organize with attributes and images.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-lg font-semibold">3. Share and sell</div>
            <p className="text-muted-foreground text-sm">
              Share your store link, accept orders, and manage everything from
              your dashboard.
            </p>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-4">
          {user ? (
            <StoreCreateButton />
          ) : (
            <>
              <Button asChild>
                <Link href={Paths.Login}>{cmn["login"] ?? "Login"}</Link>
              </Button>
              <div className="text-muted-foreground text-sm">
                Log in to create your store.
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
