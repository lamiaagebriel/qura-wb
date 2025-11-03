import { Paths } from "@/constants";
import { SelectItem } from "@/types";

import { logout } from "@/servers/auth";
import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

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
        <Avatar
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "rounded-full"
          )}
        >
          <AvatarImage src={user?.image!} alt={user?.name ?? ""} />
          <AvatarFallback className="bg-transparent">
            <Icons.user />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={4}
        className="w-[12rem]"
      >
        <DropdownMenuLabel>
          <h2>{user?.name}</h2>
          <p className="text-muted-foreground line-clamp-1 truncate text-xs">
            {user?.email}
          </p>
        </DropdownMenuLabel>

        {!!user?.stores?.[0]?.id && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>
              <p className="text-muted-foreground text-xs">Go to</p>
            </DropdownMenuLabel>

            <DropdownMenuGroup>
              <Link href={`${Paths.DashboardStore}/${user?.stores?.[0]?.id}`}>
                <DropdownMenuItem className="line-clamp-1 flex items-center gap-2 truncate text-sm">
                  <Icons.store />
                  {user?.stores?.[0]?.name}
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
          </>
        )}
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
// user?.stores?.[0]?.id ? (
//   <Link
//     href={`${Paths.DashboardStore}/${user?.stores?.[0]?.id}`}
//     className={cn(
//       buttonVariants({ variant: "ghost" }),
//       "gap-2 hover:bg-transparent!"
//     )}
//   >
//     <Avatar className="size-6">
//       <AvatarImage src={user?.stores?.[0]?.logo ?? ""} />
//       <AvatarFallback>
//         <Icons.store />
//       </AvatarFallback>
//     </Avatar>
//     {user?.stores?.[0]?.name}
//   </Link>
// ) :
