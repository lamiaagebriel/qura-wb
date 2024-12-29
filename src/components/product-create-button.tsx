import { Store } from "@/servers/db/schema";
import { getDictionary } from "@/servers/locale";
import { createProduct } from "@/servers/products";
import { getAuth } from "@/lib/auth";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, ButtonProps } from "@/components/ui/button";
import { Form, FormButton } from "@/components/ui/form";

type ProductCreateButtonProps = { store: Pick<Store, "id"> } & ButtonProps;
export async function ProductCreateButton({
  store,
  children,
  ...props
}: ProductCreateButtonProps) {
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
          <Button variant="outline" {...props}>
            {children ?? "create product"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-h-[calc(100svh-4rem)] overflow-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Form
            infiniteLoading
            validation="create-product"
            onSubmit={createProduct}
            useForm={{
              defaultValues: { storeId: store?.id },
            }}
          >
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
