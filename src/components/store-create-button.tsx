import { getDictionary } from "@/servers/locale";
import { createStore } from "@/servers/stores";
import { getAuth } from "@/lib/auth";

import { ButtonProps } from "@/components/ui/button";
import {
  FormAlertDialogButton,
  FormInputField,
  FormSelectField,
  FormTextareaField,
} from "@/components/ui/form";

type StoreCreateButtonProps = {} & ButtonProps;
export async function StoreCreateButton({
  children,
  ...props
}: StoreCreateButtonProps) {
  const {
    cmn,
    db: { stores: ss },
  } = await getDictionary();
  const { user } = await getAuth();
  if (!user) return;

  return (
    <FormAlertDialogButton
      trigger={{
        variant: "outline",
        children: "create store",
      }}
      title={
        cmn?.[
          "are you absolutely sure that you want to delete this transactions?"
        ]
      }
      description={
        cmn?.[
          "this action cannot be undone. this will permanently delete your account and remove your data from our servers."
        ]
      }
      form={{
        infiniteLoading: true,
        validation: "create-store",
        onSubmit: createStore,
        useForm: {
          defaultValues: {
            name: "",
            category: "",
            currency: "",
            language: "",

            username: "",

            bio: "",
            logo: "",
            location: {
              country: "",
              city: "",
              state: "",
              postalCode: "",
              street: "",
            },
          },
        },
      }}
    >
      <FormInputField
        type="file"
        accept="image/*"
        multiple={false}
        field={{ name: "logo" }}
        label={ss?.["logo"]?.["logo"]}
      />
      <FormInputField
        field={{ name: "name" }}
        label={ss?.["name"]?.["name"]}
        placeholder={ss?.["name"]?.["ovve games"]}
      />
      <FormInputField
        field={{ name: "username" }}
        label={ss?.["username"]?.["username"]}
        placeholder={ss?.["username"]?.["ovvegames"]}
      />
      <FormInputField
        field={{ name: "category" }}
        label={ss?.["category"]?.["category"]}
        placeholder={ss?.["category"]?.["fashion and apparel"]}
      />
      <FormTextareaField
        field={{ name: "bio" }}
        label={ss?.["bio"]?.["bio"]}
        placeholder={ss?.["bio"]?.["type about your store..."]}
      />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <FormSelectField
          field={{ name: "currency" }}
          label={{
            className: "sr-only",
            children: ss?.["currency"]?.["currency"],
          }}
          placeholder={ss?.["currency"]?.["select currency..."]}
          items={(
            Object.keys(ss?.["currency"]?.["enums"]) as (
              | "USD"
              | "EGY"
              | "SRY"
            )[]
          )?.map((key) => ({
            value: key,
            children: ss?.["currency"]?.["enums"]?.[key]?.label ?? "",
          }))}
        />
        <FormSelectField
          field={{ name: "language" }}
          label={{
            className: "sr-only",
            children: ss?.["language"]?.["language"],
          }}
          placeholder={ss?.["language"]?.["select language..."]}
          items={(
            Object.keys(ss?.["language"]?.["enums"]) as ("EN" | "AR")[]
          )?.map((key) => ({
            value: key,
            children: ss?.["language"]?.["enums"]?.[key]?.label ?? "",
          }))}
        />
      </div>
    </FormAlertDialogButton>
  );
}
