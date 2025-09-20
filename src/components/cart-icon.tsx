"use client";

// import { useCart } from "@/lib/redux";
import { cn } from "@/lib/utils";

import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Link, LinkProps } from "@/components/ui/link";

import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";

type CartLinkProps = {} & LinkProps;
export function CartLink({ children, className, ...props }: CartLinkProps) {
  // const cart = useCart();
  const count = [];
  // cart?.products?.reduce((acc, crr) => acc + crr?.quantity, 0);
  return (
    <Tooltip
    // tip="cart"
    >
      <Link
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "relative rounded-full",
          className
        )}
        {...props}
      >
        {/* {count > 0 && ( */}
        <Badge className="absolute right-0 top-0 aspect-square -translate-y-1/2 translate-x-1/2 rounded-full border-none p-0 px-1 text-xs">
          {/* {count > 99 ? `+99` : count} */}0
        </Badge>
        {/* // )} */}
        <Icons.shoppingBag />
      </Link>
    </Tooltip>
  );
}
