import { Paths } from "@/constants";
import { SelectItem } from "@/types";

import { getAuth } from "@/lib/auth";
import { logout } from "@/servers/auth";
import { getDictionary } from "@/servers/locale";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormButton } from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
import { Link } from "@/components/ui/link";

type UserAccountNavProps = {
  items?: SelectItem[];
};

export async function UserAccountNav({
  items: _items = [],
}: UserAccountNavProps) {
  const { user } = await getAuth();
  const { cmn } = await getDictionary();
  if (!user)
    return (
      <Link href={Paths.Login} className={buttonVariants({ size: "sm" })}>
        {cmn["signup"]}
      </Link>
    );

  const items = _items?.filter((e) =>
    user?.emailVerified ? !e?.value.includes(Paths.VerifyEmail) : e
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex flex-row-reverse items-center gap-2">
          <Avatar className="size-8">
            <AvatarImage src={user?.image!} alt={user?.name ?? ""} />
            <AvatarFallback>
              <Icons.user />
            </AvatarFallback>
          </Avatar>
          {/* <p className="hidden text-sm text-muted-foreground md:block">
            {user?.email}
          </p> */}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" sideOffset={4}>
        <DropdownMenuLabel>
          <h2>{user?.name}</h2>
          <p className="text-muted-foreground text-xs">{user?.email}</p>
        </DropdownMenuLabel>
        {items?.length ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {items?.map((e, i) => {
                const Icon = e?.icon ? (Icons[e?.icon] ?? null) : null;

                return (
                  <Link key={i} href={e?.value}>
                    <DropdownMenuItem>
                      {Icon && <Icon />}
                      {e?.children}
                    </DropdownMenuItem>
                  </Link>
                );
              })}
            </DropdownMenuGroup>
          </>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <FormButton
            infiniteLoading
            onAction={logout}
            Icon={<Icons.logout />}
            variant="ghost"
            className="focus-visible:ring-none w-full justify-start text-start focus:outline-none focus-visible:ring-0"
          >
            {cmn["logout"]}
          </FormButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
