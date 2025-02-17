"use client";

import * as React from "react";

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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons";
import { Image } from "@/components/image";

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
          className="absolute -right-1 -top-1 size-4 rounded-full"
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
          control={form?.control}
          name="images"
          render={() => (
            <FormItem className="relative">
              <div className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed">
                <Icons.upload className="h-4 w-4 text-muted-foreground" />
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
          className="h-full w-full rounded-md border border-dashed text-muted-foreground"
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
                  className="absolute -right-1 -top-1 size-4 rounded-full"
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
