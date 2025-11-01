import type { Metadata } from "next";

import { Paths } from "@/constants";

import { queries } from "@/db/queries";
import { cn } from "@/lib/utils";
import { getDictionary } from "@/servers/locale";

import { ProductCard } from "@/components/product-card";
import { ProductDetailsCartForm } from "@/components/product-details-cart-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Icons } from "@/components/ui/icons";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ProductProps = Readonly<{
  params: Promise<{ "store-id": string; "product-id": string }>;
}>;
export const metadata: Metadata = { title: "Product" };
export default async function Product({ params }: ProductProps) {
  const { "store-id": storeId, "product-id": productId } = await params;
  const {
    cmn,
    db: { products: pp },
  } = await getDictionary();

  const { data: selectedProduct } = await queries.products.get({
    id: productId,
  });
  const { data: products } = await queries.products.getMany({
    storeId,
  });

  if (!selectedProduct) return <div>NO PRODUCT</div>;

  return (
    <main className="flex-1">
      <div className="container flex flex-col gap-4 py-4">
        <div className="flex items-center">
          <Link
            href={`${Paths.Store}/${storeId}`}
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            <Icons.chevronLeft />
            {cmn["back"]}
          </Link>

          <div className="flex items-center gap-4 text-muted-foreground">
            <Icons.dot />
            <p>Product Details</p>
          </div>
        </div>

        <div className="space-y-16">
          <div className="grid gap-4 overflow-hidden lg:grid-cols-2 lg:gap-10">
            <div>
              <Tabs
                defaultValue="0"
                className="-order-1 flex flex-col items-start gap-2 space-y-0 sm:order-1 sm:flex-row"
              >
                <TabsList className="h-fit gap-2 sm:max-w-24 sm:flex-col">
                  {selectedProduct?.images?.map((e, i) => (
                    <TabsTrigger
                      key={i}
                      value={i?.toString()}
                      className="p-0.5"
                    >
                      <Image
                        priority={true}
                        src={e}
                        alt={`${selectedProduct?.title}`}
                        className="aspect-square"
                      />
                    </TabsTrigger>
                  ))}
                </TabsList>

                {selectedProduct?.images?.map((e, i) => (
                  <TabsContent
                    key={i}
                    value={i?.toString()}
                    className="relative"
                  >
                    {/* <div className="absolute left-0 top-0 flex h-12 w-full items-start gap-2 bg-gradient-to-b from-black to-transparent p-2">
                      {selectedProduct?.images?.map((e, i) => (
                        <div
                          key={i}
                          className={cn("h-1 w-full rounded-md bg-white")}
                        />
                      ))}
                    </div> */}
                    {/* TODO: stickey while scrolling  */}
                    <Image
                      priority={true}
                      src={e}
                      alt={`${selectedProduct?.title}`}
                      className="aspect-square"
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col items-center sm:flex-row sm:justify-between">
                <h1 className="text-4xl font-semibold">
                  {selectedProduct?.title}
                </h1>
                <p className="text-xl font-bold">${selectedProduct?.price}</p>
              </div>

              <ProductDetailsCartForm product={selectedProduct} />

              <Accordion type="single" defaultValue="description" collapsible>
                <AccordionItem value="description">
                  <AccordionTrigger>
                    {pp["description"]["description n fit"]}
                  </AccordionTrigger>
                  <AccordionContent>
                    {selectedProduct?.description}
                  </AccordionContent>
                </AccordionItem>

                {/* <AccordionItem value="shopping">
                  <AccordionTrigger>Shopping</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4">
                      {(
                        [
                          {
                            value: "discount",
                            label: "Discount",
                            icon: "percent",
                            children: "Disc 50%",
                          },
                          {
                            value: "Package",
                            label: "package",
                            icon: "package",
                            children: "Regular Package",
                          },
                          {
                            value: "delivery-time",
                            label: "Delivery Time",
                            icon: "calender",
                            children: "3-4 Working Days",
                          },
                          {
                            value: "estimated-arrival",
                            label: "Estimated Arrival",
                            icon: "truck",
                            children: "10-12 Oct. 2024",
                          },
                        ] as (SelectItem & { label: string })[]
                      ).map((e, i) => {
                        const Icon = e?.icon ? Icons[e?.icon] : null;

                        return (
                          <div key={i} className="flex items-center gap-2">
                            <div className="rounded-full bg-muted p-4">
                              <Button size="icon" className="rounded-full">
                                {Icon && <Icon />}
                              </Button>
                            </div>
                            <div>
                              <h1 className="text-sm text-muted-foreground">
                                {e?.label}
                              </h1>
                              {e?.children}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem> */}
              </Accordion>
            </div>
          </div>

          {/* <div>
            <h1>Rating & Reviews</h1>

            <div className="grid gap-4 overflow-hidden lg:grid-cols-2 lg:gap-10">
              <div className="grid grid-cols-[150px,1fr] items-center gap-1">
                <div>
                  <p className="text-[5rem] font-bold">
                    4.5
                    <span className="text-base font-normal text-muted-foreground">
                      /5
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    (50 new reviews)
                  </p>
                </div>

                <div>
                  {Array.from({ length: 5 }).map((e, i) => (
                    <div key={i} className="grid grid-cols-[80px,1fr] gap-1">
                      <div className="flex items-center justify-end gap-1">
                        {Array.from({ length: 5 - i }).map((_, ii) => (
                          <Icons.star
                            key={ii}
                            className="fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        {5 - i}
                        <Progress value={70 - i * 15} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Card>
                <CardHeader className="flex flex-row justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={null} /> 
                      <AvatarFallback>
                        <Icons.user />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <CardTitle>Alex Mathio</CardTitle>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <Icons.star className="fill-yellow-400 text-yellow-400" />
                          <Icons.star className="fill-yellow-400 text-yellow-400" />
                          <Icons.star className="fill-yellow-400 text-yellow-400" />
                          <Icons.star className="fill-yellow-400 text-yellow-400" />
                          <Icons.star className="fill-yellow-400 text-yellow-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(new Date(), { locale })}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    &quot;Lorem ipsum dolor sit amet consectetur adipisicing
                    elit. Ab quae inventore blanditiis atque eveniet consequatur
                    quidem! Repudiandae laborum repellendus ducimus explicabo
                    repellat vel temporibus officia. Fugit nulla excepturi
                    fugiat incidunt?&quot;
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div> */}
        </div>

        <div className="mb-6 mt-16 space-y-2">
          <h1>{cmn["you maight also like:"]} </h1>

          <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent>
              {products?.map((e, i) => (
                <CarouselItem
                  key={i}
                  className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
                >
                  <ProductCard product={e} />
                </CarouselItem>
              ))}
            </CarouselContent>

            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </main>
  );
}
