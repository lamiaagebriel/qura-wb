import { AvatarProps as AvatarUIProps } from "@radix-ui/react-avatar";
import { User } from "lucia";

import { cn } from "@/lib/utils";

import {
  AvatarFallback,
  AvatarImage,
  Avatar as AvatarUI,
} from "@/components/ui/avatar";
import { IconProps, Icons } from "@/components/icons";

export type AvatarProps = {
  user: Pick<User, "name" | "image"> | null;
  icon?: IconProps & {
    name: keyof typeof Icons;
  };
  children?: React.ReactNode;
} & AvatarUIProps;

export function Avatar({ user, icon, children, ...props }: AvatarProps) {
  const Icon = Icons[icon?.["name"] ?? "user"];

  return (
    <AvatarUI {...props}>
      {user?.["image"] && (
        <AvatarImage
          src={user?.["image"]}
          alt={`${user?.["name"]} profile image`}
        />
      )}

      <AvatarFallback>
        {children ?? (
          <>
            <span className="sr-only">{user?.["name"]}</span>
            <Icon className={cn("h-3 w-3", icon?.["className"])} {...icon} />
          </>
        )}
      </AvatarFallback>
    </AvatarUI>
  );
}
