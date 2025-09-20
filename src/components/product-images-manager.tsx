// "use client";

// import * as React from "react";

// import { ColumnDef } from "@tanstack/react-table";

// import { cn } from "@/lib/utils";

// import { Button, buttonVariants } from "@/components/ui/button";
// import { DataTable, DataTableProvider } from "@/components/ui/data-table";
// import {
//   FormControl,
//   FormField,
//   FormItem,
//   FormMessage,
//   useForm,
// } from "@/components/ui/form";
// import { Icons } from "@/components/ui/icons";
// import { Image } from "@/components/ui/image";
// import { Input } from "@/components/ui/input";
// import { useLocale } from "@/components/locale-provider";

// const MAX_VISIBLE_IMAGES = 3;
// // TODO: enhance the error of uploading the same images on each click & removing unnecessary images form aws...
// export function ProductImageManager() {
//   const form = useForm?.();
//   const loading = form?.loading;
//   // Use a state to force DataTableProvider to re-render when images change
//   const [imagesVersion, setImagesVersion] = React.useState(0);

//   // Watch for changes in images and update imagesVersion to force re-render
//   React.useEffect(() => {
//     const subscription = form?.watch((value, { name }) => {
//       if (name === "images") {
//         setImagesVersion((v) => v + 1);
//       }
//     });
//     return () => subscription?.unsubscribe?.();
//   }, [form]);

//   const images = (form?.watch("images") as string[]) || [];
//   const data = images.map((e, i) => ({
//     id: i,
//     src: e,
//   }));

//   const removeImage = ({ index }: { index: number }) => {
//     const currentImages = (form.getValues("images") as string[]) || [];
//     const updatedImages = currentImages.filter((_, i) => i !== index);
//     form.setValue("images", updatedImages);
//     // setImagesVersion((v) => v + 1); // Not needed, handled by watch effect
//   };

//   const columns: ColumnDef<{ id: number; src: string }>[] = [
//     // {
//     //   id: "drag",
//     //   header: () => null,
//     //   cell: ({ row }) => <DragHandle id={row.original.id} />,
//     // },
//     {
//       accessorKey: "src",
//       header: "Preview",
//       cell: ({ row: { original: e } }) => (
//         <Image src={e?.src} alt="" className="aspect-square w-12" />
//       ),
//       enableHiding: false,
//     },
//     {
//       id: "actions",
//       cell: ({ row: { original: e } }) => {
//         const { cmn } = useLocale();

//         return (
//           <div className="flex w-full items-center justify-end">
//             <Button
//               type="button"
//               variant="destructive"
//               onClick={() => {
//                 removeImage({ index: e?.id });
//               }}
//             >
//               {cmn["delete"]}
//             </Button>
//           </div>
//         );
//       },
//     },
//   ];

//   return (
//     <DataTableProvider key={imagesVersion} columns={columns} data={data}>
//       <div className="flex flex-col gap-4">
//         <div className="flex items-center justify-end">
//           <FormField
//             control={form?.control as any}
//             name="images"
//             render={() => (
//               <FormItem className="relative">
//                 <div className={cn(buttonVariants({}), "cursor-default")}>
//                   <Icons.upload />
//                   <FormControl>
//                     <Input
//                       disabled={loading}
//                       type="file"
//                       accept="image/*"
//                       multiple={true}
//                       onChange={(e) =>
//                         form.setValue(
//                           "images",
//                           [
//                             ...(form?.getValues("images") ?? []),
//                             ...(e.target.value as unknown as string[]),
//                           ]?.filter((e) => !!e)
//                         )
//                       }
//                       className="absolute h-full w-full cursor-pointer opacity-0"
//                     />
//                   </FormControl>
//                 </div>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         </div>

//         {data?.length ? <DataTable /> : undefined}
//       </div>
//     </DataTableProvider>
//   );
// }

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  useForm,
} from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
import { Image } from "@/components/ui/image";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MAX_VISIBLE_IMAGES = 3;
// TODO: enhance the error of uploading the same images on each click & removing unnecessary images form aws...
export function ProductImageManager() {
  const form = useForm?.();
  const loading = form?.loading;

  const removeImage = (index: number) => {
    const currentImages = (form.getValues("images") as string[]) || [];
    const updatedImages = currentImages.filter((_, i) => i !== index);
    form.setValue("images", updatedImages);
  };

  const renderImage = ({ index }: any) => (
    <div className="relative">
      <Image
        alt="Product image"
        className="aspect-square w-full rounded-md object-cover object-center"
        src={form?.watch("images")?.[index]}
      />
      {form?.watch("images")?.[index] && (
        <Button
          variant="destructive"
          size="icon"
          onClick={() => removeImage(index)}
          className="absolute -top-1 -right-1 size-4 rounded-full"
          disabled={loading}
        >
          <Icons.x />
        </Button>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="col-span-3">{renderImage({ index: 0 })}</div>
      <div>{renderImage({ index: 1 })}</div>
      <div>
        {form.watch("images")?.length > 3 ? (
          <ImageGalleryDialog
            images={form.watch("images")}
            onRemove={removeImage}
            disabled={loading}
          />
        ) : (
          renderImage({ index: 2 })
        )}
      </div>
      <div>
        <FormField
          control={form?.control as any}
          name="images"
          render={() => (
            <FormItem className="relative">
              <div className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed">
                <Icons.upload className="text-muted-foreground h-4 w-4" />
                <FormControl>
                  <Input
                    disabled={loading}
                    type="file"
                    accept="image/*"
                    multiple={true}
                    onChange={(e) =>
                      form.setValue(
                        "images",
                        [
                          ...(form?.getValues("images") ?? []),
                          ...(e.target.value as unknown as string[]),
                        ]?.filter((e) => !!e)
                      )
                    }
                    className="absolute h-full w-full cursor-pointer opacity-0"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function ImageGalleryDialog({
  images,
  onRemove,
  disabled,
}: {
  disabled: boolean;
  images: string[];
  onRemove: (index: number) => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="text-muted-foreground h-full w-full rounded-md border border-dashed"
        >
          +{images.length - MAX_VISIBLE_IMAGES + 1}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[95svh] overflow-auto rounded-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Edit images</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="0">
          <TabsList className="h-auto w-full max-w-full flex-1 justify-stretch gap-4 overflow-auto bg-transparent">
            {images.map((_, i) => (
              <TabsTrigger key={i} value={i.toString()} className="w-fit p-0">
                <Image
                  alt={`Product image ${i + 1}`}
                  className="aspect-square size-16 rounded-md object-cover object-center"
                  src={images[i]}
                  height={300}
                  width={300}
                />
              </TabsTrigger>
            ))}
          </TabsList>
          {images.map((image, i) => (
            <TabsContent key={i} value={i.toString()}>
              <div className="relative">
                <Image
                  alt={`Product image ${i + 1}`}
                  className="aspect-square w-full rounded-md object-cover object-center"
                  height={300}
                  src={image}
                  width={300}
                />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => onRemove(i)}
                  className="absolute -top-1 -right-1 size-4 rounded-full"
                >
                  <Icons.x />
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
