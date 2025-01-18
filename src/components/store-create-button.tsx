import { getDictionary } from "@/servers/locale";
import { createStore } from "@/servers/stores";
import { getAuth } from "@/lib/auth";

import { ButtonProps } from "@/components/ui/button";
import {
  FormAlertDialogButton,
  FormInputField,
  FormTextareaField,
} from "@/components/ui/form";

type StoreCreateButtonProps = {} & ButtonProps;
export async function StoreCreateButton({
  children,
  ...props
}: StoreCreateButtonProps) {
  const { "form-fields": ff } = await getDictionary();
  const { user } = await getAuth();
  if (!user) return;

  return (
    <FormAlertDialogButton
      trigger={{
        variant: "outline",
        children: "create store",
      }}
      title={
        ff?.[
          "are you absolutely sure that you want to delete this transactions?"
        ]
      }
      description={
        ff?.[
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
        label={ff?.["logo"]?.["logo"]}
      />
      <FormInputField
        field={{ name: "name" }}
        label={ff?.["name"]?.["name"]}
        placeholder={ff?.["name"]?.["ovve games"]}
      />
      <FormInputField
        field={{ name: "username" }}
        label={ff?.["username"]?.["username"]}
        placeholder={ff?.["username"]?.["ovvegames"]}
      />
      <FormInputField
        field={{ name: "category" }}
        label={ff?.["category"]?.["category"]}
        placeholder={ff?.["category"]?.["fashion and apparel"]}
      />
      <FormTextareaField
        field={{ name: "bio" }}
        label={ff?.["bio"]?.["bio"]}
        placeholder={ff?.["bio"]?.["type about your store..."]}
      />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <FormInputField
          field={{ name: "currency" }}
          label={ff?.["currency"]?.["currency"]}
          placeholder={ff?.["currency"]?.["USD"]}
        />
        <FormInputField
          field={{ name: "language" }}
          label={ff?.["language"]?.["language"]}
          placeholder={ff?.["language"]?.["EN"]}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <FormInputField
          field={{ name: "location.street" }}
          label={ff?.["location"]?.["street"]?.["street"]}
          placeholder={ff?.["location"]?.["street"]?.["03 aprt., 808 building"]}
        />
        <FormInputField
          field={{ name: "location.postalCode" }}
          label={ff?.["location"]?.["postalCode"]?.["postalCode"]}
          placeholder={ff?.["location"]?.["postalCode"]?.["185047"]}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <FormInputField
          field={{ name: "location.state" }}
          label={ff?.["location"]?.["state"]?.["state"]}
          placeholder={ff?.["location"]?.["state"]?.["obour"]}
        />

        <FormInputField
          field={{ name: "location.city" }}
          label={ff?.["location"]?.["city"]?.["city"]}
          placeholder={ff?.["location"]?.["city"]?.["cairo"]}
        />
        <FormInputField
          field={{ name: "location.country" }}
          label={ff?.["location"]?.["country"]?.["country"]}
          placeholder={ff?.["location"]?.["country"]?.["egypt"]}
        />
      </div>
    </FormAlertDialogButton>
  );
}
