import { Separator } from "@/components/ui/separator";
// import { UserProfilePasswordForm } from "@/components/user-profile-password-form";
// import { UserProfilePersonalForm } from "@/components/user-profile-personal-form";
import { getAuth } from "@/lib/lucia";
import { getDictionary } from "@/lib/locale";
import { LocaleProps } from "@/types/locale";
import { Metadata } from "next";

type SettingsProps = Readonly<{
	params: Promise<LocaleProps>;
}>;

export const metadata: Metadata = { title: "Settings" };
export default async function Settings({ params }: SettingsProps) {
	const { locale } = await params;
	const dic = await getDictionary({ locale });
	const c = dic?.["ss"]?.["store"]?.["settings"]?.["profile"];
	const user = (await getAuth())?.["user"]!;

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">{c?.["profile"]}</h3>
				<p className="text-sm text-muted-foreground">
					{c?.["this is how others will see you on the site."]}
				</p>
			</div>
			<Separator />

			<div className="space-y-10">
				{/* <UserProfilePersonalForm dic={dic} user={user} />
				<UserProfilePasswordForm dic={dic} user={user} /> */}
			</div>
		</div>
	);
}
