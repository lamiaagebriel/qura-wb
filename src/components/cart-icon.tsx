"use client";

import { cn } from "@/lib/utils";

import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Link, LinkProps } from "@/components/link";

import { Badge } from "./ui/badge";
import { Tooltip } from "./ui/tooltip";

type CartLinkProps = {} & LinkProps;
export function CartLink({ children, className, ...props }: CartLinkProps) {
  // const cart = useCart();
  // const count = cart?.products?.reduce((acc, crr) => acc + crr?.["quantity"], 0);
  const count = 10;
  return (
    <Tooltip tip="cart">
      <Link
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "relative rounded-full",
          className
        )}
        {...props}
      >
        {count > 0 && (
          <Badge className="absolute right-0 top-0 aspect-square -translate-y-1/2 translate-x-1/2 rounded-full border-none p-0 px-1 text-xs">
            {count > 99 ? `+99` : count}
          </Badge>
        )}
        <Icons.shoppingBag />
      </Link>
    </Tooltip>
  );
}
