import { SelectItem } from "@/types";
import { toast } from "sonner";

import { logout } from "@/servers/auth";
import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/icons";
import { Link } from "@/components/link";

import { FormButton } from "./ui/form";

type UserAccountNavProps = {
  items?: SelectItem[];
};

export async function UserAccountNav({ items = [] }: UserAccountNavProps) {
  const { user } = await getAuth();
  const { "form-fields": ff } = await getDictionary();
  if (!user) return;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-8">
          <AvatarImage src={user?.image!} alt={user?.name ?? ""} />
          <AvatarFallback>
            <Icons.user />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" sideOffset={4}>
        <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
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
            {ff?.["logout"]}
          </FormButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
