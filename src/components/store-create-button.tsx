import { getDictionary } from "@/servers/locale";
import { createStore } from "@/servers/stores";
import { getAuth } from "@/lib/auth";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormButton,
  FormInputField,
  FormTextareaField,
} from "@/components/ui/form";

export async function StoreCreateButton() {
  const { user } = await getAuth();
  const { "form-fields": ff } = await getDictionary();
  // const [open, setOpen] = useState<boolean>(false);

  if (!user) return;
  return (
    <>
      <AlertDialog
      // open={open}
      // onOpenChange={(o) => {
      //   form.reset();
      //   setOpen(o);
      // }}
      >
        <AlertDialogTrigger asChild>
          <Button variant="outline">create store</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Form
            infiniteLoading
            validation="create-store"
            onSubmit={createStore}
            useForm={{
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
                  zip: "",
                  addressLine: "",
                },
              },
            }}
            className="flex flex-col gap-4"
          >
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
                field={{
                  name: "location.addressLine",
                }}
                label={ff?.["location"]?.["address-line"]?.["address line"]}
                placeholder={
                  ff?.["location"]?.["address-line"]?.["03 aprt., 808 building"]
                }
              />
              <FormInputField
                field={{
                  name: "location.zip",
                }}
                label={ff?.["location"]?.["zip"]?.["zip"]}
                placeholder={ff?.["location"]?.["zip"]?.["185047"]}
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <FormInputField
                field={{
                  name: "location.state",
                }}
                label={ff?.["location"]?.["state"]?.["state"]}
                placeholder={ff?.["location"]?.["state"]?.["obour"]}
              />

              <FormInputField
                field={{
                  name: "location.city",
                }}
                label={ff?.["location"]?.["city"]?.["city"]}
                placeholder={ff?.["location"]?.["city"]?.["cairo"]}
              />
              <FormInputField
                field={{
                  name: "location.country",
                }}
                label={ff?.["location"]?.["country"]?.["country"]}
                placeholder={ff?.["location"]?.["country"]?.["egypt"]}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>

              <FormButton type="submit" className="w-full">
                {ff?.["confirm"]}
              </FormButton>
            </AlertDialogFooter>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
