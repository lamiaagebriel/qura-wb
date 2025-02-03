"use client";

import { Product } from "@/servers/db/schema";

import { Button, ButtonProps } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";

import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

export type ProductDetailsCartFormProps = {
  product: Product;
  //  & { attributes: ProductAttribute[] };
};

export function ProductDetailsCartForm({
  product: e,
}: ProductDetailsCartFormProps) {
  // const cart = useCart();

  // const form = useForm<z.infer<typeof cartProductSchema>>({
  //   resolver: zodResolver(cartProductSchema),
  //   defaultValues: {
  //     product,
  //     attributes: e?.attributes?.map((e) => ({
  //       name: e?.name,
  //       value:
  //         // e?.values?.0?.name ??
  //         undefined,
  //     })),
  //     quantity: 1,
  //   },
  // });

  // async function onSubmit(data: z.infer<typeof cartProductSchema>) {
  //   cart.addToCart({
  //     ...data,
  //   });
  // }

  console.log(e?.attributes);

  return (
    // @ts-expect-error form needs more properties
    <Form className="space-y-2">
      <div className="flex flex-col items-center sm:flex-row sm:justify-between">
        <h1 className="text-4xl font-semibold">{e?.title}</h1>
        <p className="text-xl font-bold">${e?.price}</p>
      </div>

      <div className="space-y-4">
        {e?.attributes?.map((e, i) => (
          <FormField
            key={i}
            // control={form["control"]}
            name={`attributes.${i}.value`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">
                  {e?.name}
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field?.value}
                    className="flex items-center gap-1"
                  >
                    {e?.values?.map((v, j) => (
                      <FormItem key={`${i}-${j}`}>
                        <FormControl>
                          <RadioGroupItem value={v} className="peer sr-only" />
                        </FormControl>
                        <FormLabel className="flex cursor-pointer items-center rounded-full border border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground [&:has([data-state=checked])]:border-primary">
                          {v}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>

      <div>
        <FormField
          // control={form["control"]}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Qantity</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full border border-primary">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      // onClick={() => {
                      //   form.setValue(
                      //     "quantity",
                      //     form.getValues("quantity") + 1
                      //   );
                      // }}
                    >
                      <Icons.add />
                    </Button>
                    <Input
                      {...field}
                      type="number"
                      onChange={(e) =>
                        field.onChange({
                          ...e,
                          target: {
                            ...e?.target,
                            value: Number(e?.target?.value),
                          },
                        })
                      }
                      className="w-fit max-w-24 border-none shadow-none focus-visible:ring-0"
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      // onClick={() => {
                      //   form.setValue(
                      //     "quantity",
                      //     form.getValues("quantity") - 1
                      //   );
                      // }}
                    >
                      <Icons.minus />
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full flex-1 rounded-full py-4"
                  >
                    Add To Cart
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                  >
                    <Icons.heart />
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}
