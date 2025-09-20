import { getDictionary } from "@/servers/locale";
import { deleteProduct } from "@/servers/products";
import { ProductStatus, Validation } from "@/lib/validations";

import {
  FormAlertDialogButton,
  FormAlertDialogButtonProps,
  FormInputField,
  FormSelectField,
  FormTextareaField,
} from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
import {
  AttributesForm,
  AttributesPlusButton,
} from "@/components/product-attribute-form";
import { ProductImageManager } from "@/components/product-images-manager";

export const ProductForm = {
  title: async function Component() {
    const {
      db: { products: pp },
    } = await getDictionary();

    return (
      <FormInputField field={{ name: "title" }} label={pp["title"]["title"]} />
    );
  },
  slug: async function Component() {
    const {
      db: { products: pp },
    } = await getDictionary();

    return (
      <FormInputField field={{ name: "slug" }} label={pp["slug"]["slug"]} />
    );
  },
  description: async function Component() {
    const {
      db: { products: pp },
    } = await getDictionary();

    return (
      <FormTextareaField
        field={{ name: "description" }}
        label={pp["description"]["description"]}
      />
    );
  },
  cost: async function Component() {
    const {
      db: { products: pp },
    } = await getDictionary();

    return (
      <FormInputField
        type="number"
        field={{ name: "cost" }}
        label={pp["cost"]["cost"]}
      />
    );
  },
  price: async function Component() {
    const {
      db: { products: pp },
    } = await getDictionary();

    return (
      <FormInputField
        type="number"
        field={{ name: "price" }}
        label={pp["price"]["price"]}
      />
    );
  },
  compareToPrice: async function Component() {
    const {
      db: { products: pp },
    } = await getDictionary();

    return (
      <FormInputField
        type="number"
        field={{ name: "compareToPrice" }}
        label={pp["compareToPrice"]["compare to price"]}
      />
    );
  },

  attributesPlusButton: async function Component() {
    return <AttributesPlusButton />;
  },
  attributes: async function Component() {
    return <AttributesForm />;
  },
  status: async function Component() {
    const {
      db: { products: pp },
    } = await getDictionary();

    return (
      <FormSelectField
        field={{ name: "status" }}
        label={{
          className: "sr-only",
          children: pp["status"]["status"],
        }}
        placeholder={pp["status"]["select status..."]}
        items={(Object.keys(pp["status"]["enums"]) as ProductStatus[])?.map(
          (key) => ({
            value: key,
            children: (
              <div className="flex items-center gap-2">
                <Icons.dot
                  style={{
                    backgroundColor: pp["status"]["enums"][key]?.color,
                  }}
                />
                {pp["status"]["enums"][key]?.label}
              </div>
            ),
          })
        )}
      />
    );
  },
  images: async function Component() {
    return <ProductImageManager />;
  },

  delete: async function Component({
    product,
    trigger,
  }: {
    product: Validation["delete-product"];
    trigger?: Pick<FormAlertDialogButtonProps, "trigger">["trigger"];
  }) {
    const { cmn } = await getDictionary();

    return (
      <FormAlertDialogButton
        trigger={{
          variant: "destructive",
          children: cmn["delete"],
          ...trigger,
        }}
        title={cmn["are you absolutely sure?"]}
        description={
          cmn[
            "this action cannot be undone. this will permanently delete your account and remove your data from our servers."
          ]
        }
        form={{
          validation: "delete-product",
          onSubmit: deleteProduct,
          useForm: { defaultValues: { ...product } },
        }}
      />
    );
  },
};
