import * as React from "react";

import { Paths } from "@/constants/utils";

import { Product } from "@/servers/db/schema";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Icons } from "./icons";
import { Image } from "./image";
import { Link } from "./link";
import { Tooltip } from "./ui/tooltip";

type ProductCardProps = { product: Product };
export function ProductCard({ product: e }: ProductCardProps) {
  return (
    <Card className="gap-0 overflow-hidden border-none p-0 outline-none">
      <CardHeader className="relative border-none p-0 outline-none">
        <Link href={`/s/${e?.storeId}/p/${e?.id}`}>
          <Image
            src={e?.images?.[0]!}
            alt={`${e?.title}`}
            className="aspect-[9/12] border-none"
          />
        </Link>

        <div className="absolute bottom-0 right-0 z-10 rounded-tl-xl bg-background pl-[6px] pt-[6px]">
          <div className="absolute right-0 top-0 size-4 -translate-y-[calc(100%-6px+0.5px)] translate-x-[calc(6px-0.5px)] rounded-br-xl border-[6px] border-l-0 border-t-0 border-background" />
          <div className="absolute bottom-0 left-0 size-4 -translate-x-[calc(100%-6px+0.5px)] translate-y-[calc(6px-0.5px)] rounded-br-xl border-[6px] border-l-0 border-t-0 border-background" />
          <div>
            <Tooltip tip="add to cart">
              <Button size="icon">
                <Icons.shoppingBasket />
              </Button>
            </Tooltip>
          </div>
        </div>
      </CardHeader>

      <Link href={`${Paths.Store}/${e?.storeId}${Paths.StoreProduct}/${e?.id}`}>
        <CardContent className="space-y-1 p-4">
          <CardTitle>{e?.title}</CardTitle>
          <CardTitle>${e?.price}</CardTitle>
        </CardContent>
      </Link>
    </Card>
  );
}
