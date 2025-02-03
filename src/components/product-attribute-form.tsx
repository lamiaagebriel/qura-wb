"use client";

import { useFieldArray } from "react-hook-form";

import { Validation } from "@/lib/validations";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormInputField, FormTagsField, useForm } from "@/components/ui/form";
import {
  EmptyPlaceholder,
  EmptyPlaceholderDescription,
  EmptyPlaceholderIcon,
  EmptyPlaceholderTitle,
} from "@/components/empty-placeholder";
import { Icons } from "@/components/icons";

export type AttributesPlusButtonProps = {};
export const AttributesPlusButton = ({}: AttributesPlusButtonProps) => {
  const form = useForm?.();
  const attributesForm = useFieldArray({
    name: "attributes",
    control: form?.["control"],
  });

  return (
    <Button
      size="icon"
      onClick={() => attributesForm.append({ name: "", values: [] })}
    >
      <Icons.add />
    </Button>
  );
};

export type AttributesFormProps = {};
export const AttributesForm = ({}: AttributesFormProps) => {
  const form = useForm?.();

  const attributesForm = useFieldArray({
    name: "attributes",
    control: form?.["control"],
  });

  return (
    <div>
      {form.watch("attributes")?.["length"] ? (
        <Card>
          <CardContent>
            <div>
              {(
                form.watch(
                  "attributes"
                ) as Validation["update-product"]["attributes"]
              )?.map((e, i) => (
                <div
                  key={i}
                  className="mb-4 space-y-2 border-b-2 border-dashed pb-4 last:mb-0 last:border-none last:pb-0"
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <FormInputField
                      field={{ name: `attributes.${i}.name` }}
                      label={{
                        className: "sr-only",
                        // children: c["name"]
                      }}
                      //  placeholder={c["sizes"]}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => attributesForm.remove(i)}
                    >
                      <Icons.x />
                    </Button>
                  </div>
                  <FormTagsField
                    field={{ name: `attributes.${i}.values` }}
                    label={{
                      className: "sr-only",
                      children: "attribute values",
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyPlaceholder className="min-h-0">
          <EmptyPlaceholderIcon name="inbox" />
          <EmptyPlaceholderTitle>No Variants</EmptyPlaceholderTitle>
          <EmptyPlaceholderDescription>
            this is field for having multiple variants
            <br /> for customers to choose between.
          </EmptyPlaceholderDescription>
        </EmptyPlaceholder>
      )}
    </div>
  );
};
