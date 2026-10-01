"use client";

import {
  HugeiconsIcon,
  PencilEdit02Icon,
  Share08Icon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/provider";
import { href } from "@/lib/routes";
import { useShare } from "@/lib/share";

/** The owner's buttons under their profile: edit, share. */
export function ProfileActions({
  name,
  username,
}: {
  name: string;
  username: string;
}) {
  const { t } = useLocale();
  const share = useShare();

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant="secondary"
        size="xl"
        className="rounded-xl"
        // TODO: open the edit-profile screen once it exists.
        onClick={() => toast.add({ title: t("Coming soon") })}
      >
        <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
        {t("Edit profile")}
      </Button>
      <Button
        variant="secondary"
        size="xl"
        className="rounded-xl"
        // TODO: share the public profile URL once profiles have one.
        onClick={() =>
          share({ title: `${name} (@${username})`, url: href("profile") })
        }
      >
        <HugeiconsIcon icon={Share08Icon} strokeWidth={2} />
        {t("Share profile")}
      </Button>
    </div>
  );
}
