import { getDictionary } from "@/servers/locale";
import { ProductStatus } from "@/lib/validations";

import {
  FormInputField,
  FormSelectField,
  FormTextareaField,
} from "@/components/ui/form";

import { AttributesForm, AttributesPlusButton } from "./_attribute-form";
import { Icons } from "./icons";
import { ProductImageManager } from "./product-images-manager";

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
  discount: async function Component() {
    const {
      db: { products: pp },
    } = await getDictionary();

    return (
      <FormInputField
        type="number"
        field={{ name: "discount" }}
        label={pp["discount"]["discount"]}
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
  stock: async function Component() {
    const {
      db: { products: pp },
    } = await getDictionary();

    return (
      <FormInputField
        type="number"
        field={{ name: "stock" }}
        label={{
          className: "sr-only",
          children: pp["stock"]["stock"],
        }}
      />
    );
  },
};
